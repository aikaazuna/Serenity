import { isElectron } from "./utils";
import type { ClipItem } from "@shared/types";

/**
 * Replay buffer par segments.
 *
 * Pourquoi : un MediaRecorder unique produit UN flux WebM continu. Ses morceaux
 * (timeslice) ne sont pas des fichiers indépendants : ils commencent au milieu
 * d'un cluster, sans image clé. Recoller l'en-tête du début devant des morceaux
 * pris au milieu donnait des vidéos « corrompues » (images vertes/grises qui
 * bavent, gels, durée et timestamps faux).
 *
 * Ici, l'enregistreur est redémarré toutes les SEGMENT_MS : chaque segment est
 * un WebM complet qui commence par une image clé. À la sauvegarde, les derniers
 * segments sont envoyés au process principal qui les assemble avec ffmpeg.
 */

/** Durée d'un segment. Le clip final dure entre N et N + SEGMENT_MS secondes. */
const SEGMENT_MS = 5_000;
/** Durée maximale de replay proposée dans l'UI (120 s) + une marge d'un segment. */
const MAX_BUFFER_MS = 120_000 + SEGMENT_MS * 2;

export type ReplayQuality = "eco" | "balanced" | "high";

export interface ReplayProfile {
  label: string;
  hint: string;
  maxWidth: number;
  maxHeight: number;
  fps: number;
  videoBitsPerSecond: number;
}

/**
 * Le coût GPU (capture + encodage matériel) est quasi proportionnel à
 * pixels × images/seconde. Plafonner la résolution et le framerate est donc le
 * levier le plus efficace pour alléger le buffer pendant les jeux.
 */
export const REPLAY_PROFILES: Record<ReplayQuality, ReplayProfile> = {
  eco: { label: "Éco", hint: "720p · 30 fps", maxWidth: 1280, maxHeight: 720, fps: 30, videoBitsPerSecond: 3_000_000 },
  balanced: { label: "Équilibré", hint: "1080p · 30 fps", maxWidth: 1920, maxHeight: 1080, fps: 30, videoBitsPerSecond: 5_000_000 },
  high: { label: "Haute", hint: "1080p · 60 fps", maxWidth: 1920, maxHeight: 1080, fps: 60, videoBitsPerSecond: 8_000_000 },
};

interface Segment {
  blob: Blob;
  startedAt: number;
  endedAt: number;
}

interface ActiveSegment {
  recorder: MediaRecorder;
  parts: Blob[];
  startedAt: number;
  /** Résolu quand le segment est finalisé (onstop). */
  done: Promise<Segment | null>;
}

const MIME_CANDIDATES: { mime: string; container: "mp4" | "webm" }[] = [
  // H.264 : remuxé en MP4 sans ré-encodage vidéo -> lisible partout.
  { mime: "video/webm;codecs=h264,opus", container: "mp4" },
  { mime: "video/x-matroska;codecs=avc1,opus", container: "mp4" },
  // Repli : VP9 / VP8 conservés en WebM.
  { mime: "video/webm;codecs=vp9,opus", container: "webm" },
  { mime: "video/webm;codecs=vp8,opus", container: "webm" },
  { mime: "video/webm", container: "webm" },
];

class ReplayRecorderEngine {
  private stream: MediaStream | null = null;
  private active: ActiveSegment | null = null;
  private segments: Segment[] = [];
  private mimeType = "video/webm";
  private container: "mp4" | "webm" = "webm";
  private quality: ReplayQuality = "balanced";
  private isRunning = false;
  private isStarting = false;
  private cycleTimer: ReturnType<typeof setInterval> | null = null;

  public async setQuality(quality: ReplayQuality): Promise<void> {
    if (this.quality === quality) return;
    this.quality = quality;
    if (this.isRunning) {
      this.stop();
      await this.start();
    }
  }

  public getQuality(): ReplayQuality {
    return this.quality;
  }

  public async start(): Promise<boolean> {
    if (this.isRunning || this.isStarting) return true;
    if (!isElectron() || !(window as any).serenity?.clips) return false;

    this.isStarting = true;
    try {
      const sources = await (window as any).serenity.clips.getDesktopSources();
      if (!Array.isArray(sources) || sources.length === 0) {
        console.warn("[replay-recorder] No desktop sources found");
        this.isStarting = false;
        return false;
      }

      const primarySource = sources.find((s: any) => s.id.startsWith("screen")) || sources[0];

      const profile = REPLAY_PROFILES[this.quality];

      // 1. Capture écran + audio système, plafonnée en résolution / framerate
      //    (pas de minFrameRate : on n'oblige plus à pousser des images quand l'écran est statique).
      const desktopStream: MediaStream = await (navigator.mediaDevices as any).getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: "desktop",
          },
        },
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: primarySource.id,
            maxWidth: profile.maxWidth,
            maxHeight: profile.maxHeight,
            maxFrameRate: profile.fps,
          },
        },
      });

      this.stream = desktopStream;
      this.segments = [];

      // 2. Choix du codec
      const choice =
        MIME_CANDIDATES.find((c) => MediaRecorder.isTypeSupported(c.mime)) ??
        { mime: "video/webm", container: "webm" as const };
      this.mimeType = choice.mime;
      this.container = choice.container;

      // 3. Premier segment + rotation périodique
      this.active = this.startSegment();
      this.cycleTimer = setInterval(() => {
        void this.rotate();
      }, SEGMENT_MS);

      this.isRunning = true;
      this.isStarting = false;
      console.log("[replay-recorder] Replay buffer running with", this.mimeType, "->", this.container, `(${this.quality}: ${profile.hint})`);
      return true;
    } catch (err) {
      console.error("[replay-recorder] Failed to start replay stream:", err);
      this.stop();
      return false;
    }
  }

  private startSegment(): ActiveSegment {
    const profile = REPLAY_PROFILES[this.quality];
    const recorder = new MediaRecorder(this.stream!, {
      mimeType: this.mimeType,
      videoBitsPerSecond: profile.videoBitsPerSecond,
    });
    const parts: Blob[] = [];
    const startedAt = Date.now();

    const done = new Promise<Segment | null>((resolve) => {
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) parts.push(event.data);
      };
      recorder.onstop = () => {
        if (parts.length === 0) return resolve(null);
        resolve({ blob: new Blob(parts, { type: this.mimeType }), startedAt, endedAt: Date.now() });
      };
      recorder.onerror = (err) => {
        console.error("[replay-recorder] MediaRecorder error:", err);
      };
    });

    recorder.start();
    return { recorder, parts, startedAt, done };
  }

  /**
   * Termine le segment en cours et en démarre immédiatement un nouveau.
   * Retourne le segment terminé une fois finalisé.
   */
  private async rotate(): Promise<Segment | null> {
    if (!this.stream || !this.active) return null;

    const finishing = this.active;
    // Démarre le suivant tout de suite pour minimiser le trou entre segments.
    this.active = this.startSegment();

    try {
      if (finishing.recorder.state !== "inactive") finishing.recorder.stop();
    } catch {}

    const segment = await finishing.done;
    if (segment) {
      this.segments.push(segment);
      const cutoff = Date.now() - MAX_BUFFER_MS;
      while (this.segments.length > 0 && this.segments[0]!.endedAt < cutoff) {
        this.segments.shift();
      }
    }
    return segment;
  }

  public stop(): void {
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }
    if (this.active && this.active.recorder.state !== "inactive") {
      try {
        this.active.recorder.stop();
      } catch {}
    }
    this.active = null;
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.segments = [];
    this.isRunning = false;
    this.isStarting = false;
  }

  public async saveReplay(durationSeconds: number = 30): Promise<ClipItem | null> {
    if (!this.isRunning) {
      const ok = await this.start();
      if (!ok) {
        console.warn("[replay-recorder] Cannot save replay: recorder failed to start");
        return null;
      }
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Finalise le segment en cours pour inclure les toutes dernières secondes.
    await this.rotate();

    // Remonte depuis le segment le plus récent jusqu'à couvrir la durée demandée.
    const wantedMs = durationSeconds * 1000;
    const selected: Segment[] = [];
    let covered = 0;
    for (let i = this.segments.length - 1; i >= 0 && covered < wantedMs; i--) {
      const seg = this.segments[i]!;
      selected.unshift(seg);
      covered += seg.endedAt - seg.startedAt;
    }

    if (selected.length === 0) {
      console.warn("[replay-recorder] No segments captured yet");
      return null;
    }

    try {
      const buffers = await Promise.all(selected.map((s) => s.blob.arrayBuffer()));
      const dateStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

      return await (window as any).serenity.clips.saveVideoBlob({
        segments: buffers,
        container: this.container,
        filename: `Clip_${dateStr}`,
        durationSeconds,
      });
    } catch (err) {
      console.error("[replay-recorder] Failed to save replay:", err);
      return null;
    }
  }

  public getIsActive(): boolean {
    return this.isRunning;
  }
}

export const replayRecorder = new ReplayRecorderEngine();
