import { useAppStore } from "@/state/appStore";

export function useAnimationsEnabled(): boolean {
  return useAppStore((s) => s.settings.animationsEnabled);
}
