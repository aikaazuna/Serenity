import { isElectron } from "./utils";
import type { ClipItem } from "@shared/types";

class ReplayRecorderEngine {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: { data: Blob; timestamp: number }[] = [];
  private headerChunk: Blob | null = null;
  private isRunning = false;
  private isStarting = false;
  private cycleTimer: ReturnType<typeof setInterval> | null = null;

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

      // 1. Capture screen video & system audio
      const desktopStream = await (navigator.mediaDevices as any).getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: "desktop",
          },
        },
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: primarySource.id,
            minFrameRate: 30,
            maxFrameRate: 60,
          },
        },
      });

      this.stream = desktopStream;
      this.chunks = [];
      this.headerChunk = null;

      // 2. Prioritize widely compatible codecs (VP8/Opus or standard WebM)
      const mimeCandidates = [
        "video/webm;codecs=vp8,opus",
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=h264,opus",
        "video/webm",
      ];
      const selectedMime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm";

      const recorder = new MediaRecorder(desktopStream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 8_000_000,
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          const now = Date.now();
          if (!this.headerChunk) {
            this.headerChunk = event.data;
          }
          this.chunks.push({ data: event.data, timestamp: now });

          // Keep max 130 seconds in memory
          const cutoff = now - 130_000;
          while (this.chunks.length > 0 && (this.chunks[0]?.timestamp ?? 0) < cutoff) {
            this.chunks.shift();
          }
        }
      };

      recorder.onerror = (err) => {
        console.error("[replay-recorder] MediaRecorder error:", err);
      };

      recorder.start(1000);
      this.mediaRecorder = recorder;
      this.isRunning = true;
      this.isStarting = false;
      console.log("[replay-recorder] Replay buffer running with", selectedMime);
      return true;
    } catch (err) {
      console.error("[replay-recorder] Failed to start replay stream:", err);
      this.isStarting = false;
      this.isRunning = false;
      return false;
    }
  }

  public stop(): void {
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.chunks = [];
    this.headerChunk = null;
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

    // Request latest slice
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      try {
        this.mediaRecorder.requestData();
      } catch {}
    }

    await new Promise((r) => setTimeout(r, 100));

    const now = Date.now();
    const cutoff = now - durationSeconds * 1000;
    const matching = this.chunks.filter((c) => c.timestamp >= cutoff);

    let finalBlobs: Blob[] = [];

    if (matching.length > 0) {
      // ALWAYS ensure the EBML Header Chunk is at index 0 of the file
      if (this.headerChunk && matching[0]?.data !== this.headerChunk) {
        finalBlobs = [this.headerChunk, ...matching.map((c) => c.data)];
      } else {
        finalBlobs = matching.map((c) => c.data);
      }
    } else if (this.chunks.length > 0) {
      if (this.headerChunk && this.chunks[0]?.data !== this.headerChunk) {
        finalBlobs = [this.headerChunk, ...this.chunks.map((c) => c.data)];
      } else {
        finalBlobs = this.chunks.map((c) => c.data);
      }
    }

    if (finalBlobs.length === 0) {
      console.warn("[replay-recorder] No chunks captured yet");
      return null;
    }

    try {
      const fullBlob = new Blob(finalBlobs, { type: "video/webm" });
      const arrayBuffer = await fullBlob.arrayBuffer();

      const dateStr = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const filename = `Clip_${dateStr}.webm`;

      const item = await (window as any).serenity.clips.saveVideoBlob({
        buffer: arrayBuffer,
        filename,
        durationSeconds,
      });

      return item;
    } catch (err) {
      console.error("[replay-recorder] Failed to compile and save replay blob:", err);
      return null;
    }
  }

  public getIsActive(): boolean {
    return this.isRunning;
  }
}

export const replayRecorder = new ReplayRecorderEngine();
