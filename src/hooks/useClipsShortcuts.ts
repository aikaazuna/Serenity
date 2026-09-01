import { useEffect } from "react";
import { useClipsStore } from "@/state/clipsStore";
import { useAppStore } from "@/state/appStore";
import { replayRecorder } from "@/lib/replay-recorder";
import { isElectron } from "@/lib/utils";
import type { ClipItem } from "@shared/types";

export function useClipsShortcuts(): void {
  const replayActive = useClipsStore((s) => s.replayActive);
  const replayDuration = useClipsStore((s) => s.replayDuration);
  const settings = useAppStore((s) => s.settings);

  // 1. Démarre / arrête le buffer de replay selon l'état
  useEffect(() => {
    if (replayActive) {
      void replayRecorder.start();
    } else {
      replayRecorder.stop();
    }
  }, [replayActive]);

  // 2. Enregistre les raccourcis configurés auprès du main process
  useEffect(() => {
    if (!isElectron() || !(window as any).serenity?.clips?.registerShortcuts) return;

    void (window as any).serenity.clips.registerShortcuts({
      replayShortcut: settings.clips?.replayShortcut ?? "Alt+F10",
      screenshotShortcut: settings.clips?.screenshotShortcut ?? "Alt+F1",
    });
  }, [settings.clips?.replayShortcut, settings.clips?.screenshotShortcut]);

  // 3. Écoute les déclenchements de raccourcis globaux
  useEffect(() => {
    if (!isElectron() || !(window as any).serenity?.clips) return;

    const unsubs: (() => void)[] = [];

    // Raccourci Replay (Alt+F10 ou personnalisé)
    if ((window as any).serenity.clips.onReplayTriggered) {
      const u1 = (window as any).serenity.clips.onReplayTriggered(async () => {
        const isReplayActive = useClipsStore.getState().replayActive;
        if (!isReplayActive) {
          useAppStore.getState().notify("Replay Buffer inactif. Activez-le pour enregistrer des clips.", "warning");
          return;
        }
        const item = await replayRecorder.saveReplay(replayDuration);
        if (item) {
          useClipsStore.setState((state) => ({
            items: [item, ...state.items.filter((i) => i.id !== item.id)],
          }));
          useAppStore.getState().notify(`Clip ${replayDuration}s sauvegardé avec succès !`, "success");
        }
      });
      unsubs.push(u1);
    }

    // Raccourci Screenshot (Alt+F1 ou personnalisé)
    if ((window as any).serenity.clips.onScreenshotTriggered) {
      const u2 = (window as any).serenity.clips.onScreenshotTriggered((item: ClipItem) => {
        if (item) {
          useClipsStore.setState((state) => ({
            items: [item, ...state.items.filter((i) => i.id !== item.id)],
          }));
          useAppStore.getState().notify("Capture d'écran enregistrée et copiée !", "success");
        }
      });
      unsubs.push(u2);
    }

    return () => {
      for (const u of unsubs) u();
    };
  }, [replayDuration]);
}
