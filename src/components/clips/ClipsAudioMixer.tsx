import React, { useState } from "react";
import { Film, Gamepad2, Mic, Mic2, Music, Zap, Save, Camera, FolderOpen, Clock, Settings2, X } from "lucide-react";
import { useClipsStore } from "@/state/clipsStore";
import { useAppStore } from "@/state/appStore";
import { ShortcutRecorder } from "@/components/settings/ShortcutRecorder";
import { isElectron } from "@/lib/utils";

const trackIcons: Record<string, any> = {
  game: Gamepad2,
  mic: Mic,
  chat: Mic2,
  media: Music,
};

export const ClipsAudioMixer: React.FC = () => {
  const tracks = useClipsStore((s) => s.tracks);
  const toggleTrack = useClipsStore((s) => s.toggleTrack);
  const setTrackVol = useClipsStore((s) => s.setTrackVol);
  const replayActive = useClipsStore((s) => s.replayActive);
  const toggleReplayActive = useClipsStore((s) => s.toggleReplayActive);
  const replayDuration = useClipsStore((s) => s.replayDuration);
  const setReplayDuration = useClipsStore((s) => s.setReplayDuration);
  const saveReplay = useClipsStore((s) => s.saveReplay);
  const takeScreenshot = useClipsStore((s) => s.takeScreenshot);
  const openFolder = useClipsStore((s) => s.openFolder);
  const isSavingReplay = useClipsStore((s) => s.isSavingReplay);
  const isTakingScreenshot = useClipsStore((s) => s.isTakingScreenshot);

  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const notify = useAppStore((s) => s.notify);

  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);

  const replayShortcut = settings.clips?.replayShortcut || "Alt+F10";
  const screenshotShortcut = settings.clips?.screenshotShortcut || "Alt+F1";

  const handleManualReplay = async () => {
    if (!replayActive) {
      notify("Replay Buffer inactif. Activez-le pour sauvegarder un clip.", "warning");
      return;
    }
    const item = await saveReplay();
    if (item) {
      notify(`Clip ${replayDuration}s sauvegardé avec succès !`, "success");
    }
  };

  const handleManualScreenshot = async () => {
    const item = await takeScreenshot();
    if (item) {
      notify("Capture d'écran enregistrée et copiée !", "success");
    }
  };

  const handleUpdateReplayShortcut = (accelerator: string) => {
    void updateSettings({
      clips: {
        ...(settings.clips || {}),
        replayShortcut: accelerator,
      } as any,
    });
    if (isElectron() && (window as any).serenity?.clips?.registerShortcuts) {
      void (window as any).serenity.clips.registerShortcuts({
        replayShortcut: accelerator,
        screenshotShortcut,
      });
    }
    notify("Raccourci Replay mis à jour", "success", accelerator || "Désactivé");
  };

  const handleUpdateScreenshotShortcut = (accelerator: string) => {
    void updateSettings({
      clips: {
        ...(settings.clips || {}),
        screenshotShortcut: accelerator,
      } as any,
    });
    if (isElectron() && (window as any).serenity?.clips?.registerShortcuts) {
      void (window as any).serenity.clips.registerShortcuts({
        replayShortcut,
        screenshotShortcut: accelerator,
      });
    }
    notify("Raccourci Capture mis à jour", "success", accelerator || "Désactivé");
  };

  return (
    <div className="apple-card p-5 sm:p-6 border border-[color:var(--card-border)] bg-[color:var(--card-bg)] shadow-sm rounded-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[color:var(--panel-border)] pb-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#BF5AF2]/15 text-[#BF5AF2] flex items-center justify-center shadow-xs">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-bold text-[color:var(--text-primary)] tracking-tight">
                Centre de Capture & Mixeur Audio Multi-Pistes
              </h3>
              <button
                type="button"
                onClick={() => setIsShortcutModalOpen(true)}
                className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#BF5AF2] bg-[#BF5AF2]/10 hover:bg-[#BF5AF2]/20 px-2 py-0.5 rounded-md transition cursor-pointer"
                title="Modifier les raccourcis clavier"
              >
                <span>{replayShortcut || "OFF"} • {screenshotShortcut || "OFF"}</span>
                <Settings2 className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-secondary mt-0.5">
              Gérez les pistes audio incluses dans vos vidéos et personnalisez vos raccourcis en jeu.
            </p>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Duration Selector */}
          <div className="apple-inner-box flex items-center p-1 rounded-xl gap-1">
            <Clock className="w-3.5 h-3.5 text-secondary ml-1.5" />
            {[15, 30, 60, 120].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setReplayDuration(sec)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  replayDuration === sec
                    ? "bg-[#BF5AF2] text-white shadow-xs"
                    : "text-secondary hover:text-[color:var(--text-primary)]"
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          {/* Replay Buffer Toggle */}
          <button
            type="button"
            onClick={toggleReplayActive}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer shadow-xs ${
              replayActive
                ? "bg-[#30D158]/15 border-[#30D158]/40 text-[#30D158]"
                : "bg-neutral-500/10 border-neutral-500/25 text-neutral-400"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Replay Buffer : {replayActive ? "ACTIF" : "OFF"}</span>
          </button>

          {/* Instant Replay Save Button */}
          <button
            type="button"
            onClick={handleManualReplay}
            disabled={isSavingReplay}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#BF5AF2] hover:bg-[#a844dc] text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            title={`Sauvegarder le Replay (Raccourci : ${replayShortcut})`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingReplay ? "Sauvegarde..." : `Clip Replay (${replayShortcut})`}</span>
          </button>

          {/* Screenshot Button */}
          <button
            type="button"
            onClick={handleManualScreenshot}
            disabled={isTakingScreenshot}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0A84FF] hover:bg-[#0071E3] text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
            title={`Prendre une capture d'écran (Raccourci : ${screenshotShortcut})`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isTakingScreenshot ? "Capture..." : `Capture (${screenshotShortcut})`}</span>
          </button>

          {/* Shortcut Settings Button */}
          <button
            type="button"
            onClick={() => setIsShortcutModalOpen(true)}
            className="apple-inner-box p-2 text-secondary hover:text-[color:var(--text-primary)] rounded-xl transition cursor-pointer"
            title="Modifier les raccourcis de capture"
          >
            <Settings2 className="w-4 h-4" />
          </button>

          {/* Open Folder Button */}
          <button
            type="button"
            onClick={() => void openFolder()}
            className="apple-inner-box p-2 text-secondary hover:text-[color:var(--text-primary)] rounded-xl transition cursor-pointer"
            title="Ouvrir le dossier des clips dans Windows"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Multi-Track Audio Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
            Routage des pistes audio capturées
          </span>
          <span className="text-[11px] text-tertiary">
            Chaque piste active est isolée pour un mixage parfait
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.keys(tracks).map((key) => {
            const tr = tracks[key];
            if (!tr) return null;
            const Icon = trackIcons[key] || Film;
            return (
              <div
                key={key}
                className={`apple-inner-box p-3.5 rounded-2xl border transition-all flex flex-col gap-3 ${
                  tr.enabled
                    ? "bg-[color:var(--panel-bg)] border-[color:var(--panel-border-strong)]"
                    : "bg-neutral-500/5 border-neutral-500/15 opacity-55"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleTrack(key)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition cursor-pointer shadow-xs"
                      style={{
                        backgroundColor: tr.enabled ? `${tr.color}25` : "rgba(128,128,128,0.15)",
                        color: tr.enabled ? tr.color : "gray",
                      }}
                      title={tr.enabled ? "Désactiver de l'enregistrement" : "Activer dans l'enregistrement"}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-[color:var(--text-primary)] truncate">
                      {tr.label.split("(")[0]?.trim() ?? tr.label}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-tertiary">
                    {tr.enabled ? `${tr.vol}%` : "OFF"}
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={100}
                  disabled={!tr.enabled}
                  value={tr.vol}
                  onChange={(e) => setTrackVol(key, Number(e.target.value))}
                  className="w-full h-1.5 rounded-full cursor-pointer accent-[#BF5AF2] bg-neutral-200 dark:bg-white/10"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Shortcut Modifier Modal */}
      {isShortcutModalOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-fade-in">
          <div className="absolute inset-0" onClick={() => setIsShortcutModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-[color:var(--card-bg)] border border-[color:var(--panel-border-strong)] rounded-3xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[color:var(--panel-border)] pb-3">
              <div className="flex items-center gap-2.5">
                <Settings2 className="w-4 h-4 text-[#BF5AF2]" />
                <h3 className="text-sm font-bold text-[color:var(--text-primary)]">
                  Modifier les raccourcis de capture
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShortcutModalOpen(false)}
                className="p-1.5 text-secondary hover:text-[color:var(--text-primary)] rounded-xl transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[color:var(--text-primary)]">
                  Raccourci Replay Buffer (30s)
                </label>
                <p className="text-[11px] text-secondary">
                  Appuyez sur une combinaison (ex: Alt+F10, F8, Ctrl+Shift+S...)
                </p>
                <ShortcutRecorder
                  value={replayShortcut}
                  onChange={handleUpdateReplayShortcut}
                  placeholder="Appuyez sur une touche..."
                />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[color:var(--panel-border)]">
                <label className="text-xs font-bold text-[color:var(--text-primary)]">
                  Raccourci Capture d'écran instantanée
                </label>
                <p className="text-[11px] text-secondary">
                  Capture et copie directement l'image dans le presse-papiers (ex: Alt+F1, F9...)
                </p>
                <ShortcutRecorder
                  value={screenshotShortcut}
                  onChange={handleUpdateScreenshotShortcut}
                  placeholder="Appuyez sur une touche..."
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[color:var(--panel-border)] flex justify-end">
              <button
                type="button"
                onClick={() => setIsShortcutModalOpen(false)}
                className="px-4 py-2 bg-[#0A84FF] hover:bg-[#0071E3] text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
