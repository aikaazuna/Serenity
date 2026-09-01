import { globalShortcut, BrowserWindow } from "electron";
import { startPicker } from "./windows/pickerWindows.js";
import { showOverlayNotification } from "./windows/overlayWindow.js";
import { captureScreenshot } from "./clips/clipsManager.js";
import { store } from "./store.js";
import {
  IpcChannels,
  type MixerGlobalShortcutBinding,
  type MixerChannelVolumeState,
  type StoreSchema,
} from "../shared/types.js";

let currentPickerAccelerator: string | null = null;
let currentReplayAccelerator: string | null = null;
let currentScreenshotAccelerator: string | null = null;
let registeredMixerAccelerators: string[] = [];

/**
 * État courant des canaux mixer, maintenu à jour par le renderer via MixerSyncState.
 * Permet au main process de traiter les raccourcis même quand le renderer est throttlé.
 */
const channelStateMap = new Map<string, MixerChannelVolumeState>();

/** Référence vers la fonction sendMixerCommand d'ipc.ts (injectée au registerMixerShortcuts). */
let _sendMixerCommand: ((cmd: Record<string, any>) => Promise<any>) | null = null;

/** Mise à jour de l'état depuis le renderer (appelé par le handler IPC MixerSyncState). */
export function updateChannelStates(states: MixerChannelVolumeState[]): void {
  for (const s of states) {
    channelStateMap.set(s.channelId, { ...s });
  }
}

/** Réinitialise l'état des canaux (appelé au unregister). */
export function clearChannelStates(): void {
  channelStateMap.clear();
}

/**
 * Notifie le renderer du nouvel état d'un canal pour synchroniser le store Zustand.
 */
function notifyRendererStateUpdate(channelId: string, state: MixerChannelVolumeState): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(IpcChannels.MixerOnStateUpdated, { channelId, state });
    }
  }
}

/**
 * (Ré)enregistre le raccourci global de la pipette.
 */
export function registerPickerShortcut(accelerator: string): boolean {
  if (currentPickerAccelerator) {
    globalShortcut.unregister(currentPickerAccelerator);
    currentPickerAccelerator = null;
  }

  if (!accelerator || !accelerator.trim()) return true;

  try {
    const ok = globalShortcut.register(accelerator, () => {
      void startPicker();
    });
    if (ok) currentPickerAccelerator = accelerator;
    return ok;
  } catch (e) {
    console.warn("Failed to register picker shortcut", accelerator, e);
    return false;
  }
}

/**
 * Applique un changement de volume/mute directement depuis le main process
 * et affiche l'overlay + notifie le renderer.
 */
async function handleShortcutAction(
  binding: MixerGlobalShortcutBinding,
  sendMixerCommand: (cmd: Record<string, any>) => Promise<any>
): Promise<void> {
  const state = channelStateMap.get(binding.channelId);
  if (!state) return;

  const STEP = 5;
  let newHeadphoneVolume = state.headphoneVolume;
  let newStreamVolume = state.streamVolume;
  let newHeadphoneMuted = state.headphoneMuted;
  let newStreamMuted = state.streamMuted;

  if (binding.action === "volUp") {
    if (binding.target === "headphone") newHeadphoneVolume = Math.min(100, state.headphoneVolume + STEP);
    else newStreamVolume = Math.min(100, state.streamVolume + STEP);
  } else if (binding.action === "volDown") {
    if (binding.target === "headphone") newHeadphoneVolume = Math.max(0, state.headphoneVolume - STEP);
    else newStreamVolume = Math.max(0, state.streamVolume - STEP);
  } else if (binding.action === "mute") {
    if (binding.target === "headphone") newHeadphoneMuted = !state.headphoneMuted;
    else newStreamMuted = !state.streamMuted;
  }

  // Appliquer aux processus Windows via le worker mixer (headphone uniquement — le stream est géré par OBS/DAW)
  if (binding.target === "headphone") {
    for (const proc of state.processNames) {
      if (newHeadphoneMuted) {
        void sendMixerCommand({ action: "set-process-mute", processName: proc, isMuted: true });
      } else {
        void sendMixerCommand({ action: "set-process-volume", processName: proc, volume: newHeadphoneVolume / 100 });
        void sendMixerCommand({ action: "set-process-mute", processName: proc, isMuted: false });
      }
    }
  }

  // Mettre à jour l'état en mémoire
  const updatedState: MixerChannelVolumeState = {
    ...state,
    headphoneVolume: newHeadphoneVolume,
    streamVolume: newStreamVolume,
    headphoneMuted: newHeadphoneMuted,
    streamMuted: newStreamMuted,
  };
  channelStateMap.set(binding.channelId, updatedState);

  // Afficher l'overlay HUD
  const appSettings = store.get("settings") as StoreSchema["settings"] | undefined;
  const volume = binding.target === "headphone" ? newHeadphoneVolume : newStreamVolume;
  const isMuted = binding.target === "headphone" ? newHeadphoneMuted : newStreamMuted;
  const actionType = binding.action === "mute" ? "mute" : binding.action === "volUp" ? "up" : "down";

  showOverlayNotification({
    type: "volume",
    items: [{
      id: `${binding.channelId}-${binding.target}`,
      channelId: binding.channelId,
      channelName: binding.channelName,
      channelColor: binding.channelColor,
      target: binding.target,
      volume,
      isMuted,
      actionType,
    }],
    settings: { ...appSettings?.overlay },
  });

  // Synchroniser le store Zustand du renderer
  notifyRendererStateUpdate(binding.channelId, updatedState);
}

/**
 * Enregistre tous les raccourcis globaux des canaux du mixer audio.
 * Traite les actions entièrement dans le main process pour fonctionner même
 * quand la fenêtre est en arrière-plan / throttlée par Chromium.
 */
export function registerMixerShortcuts(
  bindings: MixerGlobalShortcutBinding[],
  sendMixerCommand: (cmd: Record<string, any>) => Promise<any>
): boolean {
  _sendMixerCommand = sendMixerCommand;

  // Dés-enregistrer les anciens raccourcis mixer
  for (const acc of registeredMixerAccelerators) {
    if (globalShortcut.isRegistered(acc)) {
      globalShortcut.unregister(acc);
    }
  }
  registeredMixerAccelerators = [];

  if (!bindings || !Array.isArray(bindings)) return true;

  // Regrouper par accelerator (plusieurs canaux peuvent partager un même raccourci)
  const groupedByAccelerator = new Map<string, MixerGlobalShortcutBinding[]>();
  for (const b of bindings) {
    if (!b.accelerator || !b.accelerator.trim()) continue;
    const key = b.accelerator.trim();
    const existing = groupedByAccelerator.get(key) || [];
    existing.push(b);
    groupedByAccelerator.set(key, existing);
  }

  for (const [accelerator, boundList] of groupedByAccelerator.entries()) {
    try {
      const ok = globalShortcut.register(accelerator, () => {
        const cmd = _sendMixerCommand;
        if (!cmd) return;
        for (const item of boundList) {
          void handleShortcutAction(item, cmd);
        }
      });
      if (ok) registeredMixerAccelerators.push(accelerator);
    } catch (err) {
      console.warn("Could not register global mixer shortcut:", accelerator, err);
    }
  }

  return true;
}

/**
 * Enregistre les raccourcis globaux pour les Clips (Alt+F10) et Captures d'écran (Alt+F1).
 */
export function registerClipsShortcuts(settings?: { replayShortcut?: string; screenshotShortcut?: string }): boolean {
  if (currentReplayAccelerator && globalShortcut.isRegistered(currentReplayAccelerator)) {
    globalShortcut.unregister(currentReplayAccelerator);
    currentReplayAccelerator = null;
  }
  if (currentScreenshotAccelerator && globalShortcut.isRegistered(currentScreenshotAccelerator)) {
    globalShortcut.unregister(currentScreenshotAccelerator);
    currentScreenshotAccelerator = null;
  }

  const appSettings = store.get("settings") as StoreSchema["settings"] | undefined;
  const replayAcc = settings?.replayShortcut || appSettings?.clips?.replayShortcut || "Alt+F10";
  const screenshotAcc = settings?.screenshotShortcut || appSettings?.clips?.screenshotShortcut || "Alt+F1";

  // 1. Raccourci Capture d'écran (Alt+F1)
  if (screenshotAcc && screenshotAcc.trim()) {
    try {
      const ok = globalShortcut.register(screenshotAcc.trim(), async () => {
        const item = await captureScreenshot();
        for (const win of BrowserWindow.getAllWindows()) {
          if (!win.isDestroyed()) {
            win.webContents.send(IpcChannels.ClipsOnScreenshotTriggered, item);
          }
        }
      });
      if (ok) currentScreenshotAccelerator = screenshotAcc.trim();
    } catch (err) {
      console.warn("Failed to register screenshot shortcut:", screenshotAcc, err);
    }
  }

  // 2. Raccourci Replay Buffer (Alt+F10)
  if (replayAcc && replayAcc.trim()) {
    try {
      const ok = globalShortcut.register(replayAcc.trim(), () => {
        for (const win of BrowserWindow.getAllWindows()) {
          if (!win.isDestroyed()) {
            win.webContents.send(IpcChannels.ClipsOnReplayTriggered);
          }
        }
      });
      if (ok) currentReplayAccelerator = replayAcc.trim();
    } catch (err) {
      console.warn("Failed to register replay shortcut:", replayAcc, err);
    }
  }

  return true;
}

export function unregisterAllShortcuts(): void {
  globalShortcut.unregisterAll();
  currentPickerAccelerator = null;
  currentReplayAccelerator = null;
  currentScreenshotAccelerator = null;
  registeredMixerAccelerators = [];
  channelStateMap.clear();
  _sendMixerCommand = null;
}


