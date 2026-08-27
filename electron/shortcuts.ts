import { globalShortcut } from "electron";
import { startPicker } from "./windows/pickerWindows.js";
import { getMainWindow } from "./windows/mainWindow.js";
import { showOverlayNotification } from "./windows/overlayWindow.js";
import { IpcChannels, type MixerGlobalShortcutBinding, type OverlayNotificationItem } from "../shared/types.js";

let currentPickerAccelerator: string | null = null;
let registeredMixerAccelerators: string[] = [];

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
 * Enregistre tous les raccourcis globaux des canaux du mixer audio.
 * Quand une touche est pressée (en jeu, sur le bureau...), l'overlay système s'affiche
 * et la modification de volume/mute est envoyée à Serenity Hub.
 */
export function registerMixerShortcuts(bindings: MixerGlobalShortcutBinding[]): boolean {
  // Unregister previously registered mixer shortcuts
  for (const acc of registeredMixerAccelerators) {
    if (globalShortcut.isRegistered(acc)) {
      globalShortcut.unregister(acc);
    }
  }
  registeredMixerAccelerators = [];

  if (!bindings || !Array.isArray(bindings)) return true;

  // Group bindings by accelerator (e.g. if user assigned the same shortcut to multiple channels)
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
        const mainWindow = getMainWindow();
        const overlayItems: OverlayNotificationItem[] = [];

        for (const item of boundList) {
          // Notify main window to adjust state
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send(IpcChannels.MixerOnShortcutAction, {
              channelId: item.channelId,
              target: item.target,
              action: item.action,
            });
          }

          overlayItems.push({
            id: `${item.channelId}-${item.target}`,
            channelId: item.channelId,
            channelName: item.channelName,
            channelColor: item.channelColor,
            target: item.target,
            volume: 80, // will be rendered dynamically by store or items
            isMuted: item.action === "mute",
            actionType: item.action === "volUp" ? "up" : item.action === "volDown" ? "down" : "mute",
          });
        }

        // Show floating screen overlay on top-right of Windows
        if (overlayItems.length > 0) {
          showOverlayNotification({
            type: "volume",
            items: overlayItems,
          });
        }
      });

      if (ok) {
        registeredMixerAccelerators.push(accelerator);
      }
    } catch (err) {
      console.warn("Could not register global mixer shortcut:", accelerator, err);
    }
  }

  return true;
}

export function unregisterAllShortcuts(): void {
  globalShortcut.unregisterAll();
  currentPickerAccelerator = null;
  registeredMixerAccelerators = [];
}
