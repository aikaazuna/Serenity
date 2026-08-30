import { useEffect } from "react";
import { useAppStore } from "@/state/appStore";
import { isElectron } from "@/lib/utils";

/**
 * Connecte les évènements IPC de la pipette système (ouverture / capture / annulation)
 * au store applicatif. À monter une seule fois à la racine de l'app.
 */
export function usePickerBridge(): void {
  const setActiveColor = useAppStore((s) => s.setActiveColor);
  const setPickerActive = useAppStore((s) => s.setPickerActive);
  const triggerCaptureFlash = useAppStore((s) => s.triggerCaptureFlash);
  const notify = useAppStore((s) => s.notify);

  useEffect(() => {
    if (!isElectron()) return;

    const offOpen = window.serenity.picker.onOpen(() => setPickerActive(true));
    const offCaptured = window.serenity.picker.onCaptured(({ hex }) => {
      setPickerActive(false);
      setActiveColor(hex, "picker");
      triggerCaptureFlash(hex);
    });
    const offCancelled = window.serenity.picker.onCancelled(() => {
      setPickerActive(false);
    });

    return () => {
      offOpen();
      offCaptured();
      offCancelled();
    };
  }, [setActiveColor, setPickerActive, triggerCaptureFlash, notify]);
}

export function startPicker(): void {
  if (isElectron()) void window.serenity.picker.start();
}
