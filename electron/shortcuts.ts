import { globalShortcut } from "electron";
import { startPicker } from "./windows/pickerWindows.js";

let currentAccelerator: string | null = null;

/**
 * (Ré)enregistre le raccourci global de la pipette. Retourne `true` si l'enregistrement
 * a réussi, `false` si l'accélérateur est invalide ou déjà pris par le système/une autre app.
 */
export function registerPickerShortcut(accelerator: string): boolean {
  if (currentAccelerator) {
    globalShortcut.unregister(currentAccelerator);
    currentAccelerator = null;
  }

  const ok = globalShortcut.register(accelerator, () => {
    void startPicker();
  });

  if (ok) currentAccelerator = accelerator;
  return ok;
}

export function unregisterAllShortcuts(): void {
  globalShortcut.unregisterAll();
  currentAccelerator = null;
}
