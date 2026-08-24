import { useAppStore } from "@/state/appStore";
import { getMessages } from "@/lib/i18n";

export function useI18n() {
  const language = useAppStore((s) => s.settings.language);
  return getMessages(language);
}
