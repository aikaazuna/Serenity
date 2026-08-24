import { useCallback, useState } from "react";
import { useAppStore } from "@/state/appStore";
import { useI18n } from "@/hooks/useI18n";
import { isElectron } from "@/lib/utils";

/**
 * Copie dans le presse-papiers (IPC sécurisé en Electron, API navigateur en fallback)
 * et retourne un indicateur `copiedKey` éphémère utilisable pour l'animation de confirmation.
 */
export function useClipboard() {
  const notify = useAppStore((s) => s.notify);
  const t = useI18n();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = useCallback(
    async (text: string, key: string, label?: string) => {
      try {
        if (isElectron()) {
          window.colorflow.clipboard.writeText(text);
        } else {
          await navigator.clipboard.writeText(text);
        }
        setCopiedKey(key);
        notify(label ? `${label} — ${t.copy.copied}` : t.copy.copied, "success", text);
        setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1500);
      } catch {
        notify(t.copy.failed, "warning");
      }
    },
    [notify, t],
  );

  return { copy, copiedKey };
}
