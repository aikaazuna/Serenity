import { useEffect } from "react";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { useAppStore } from "@/state/appStore";
import { useMixerStore } from "@/state/mixerStore";
import { useTheme } from "@/hooks/useTheme";
import { usePickerBridge } from "@/hooks/usePickerBridge";
import { useAnimationsEnabled } from "@/hooks/useAnimations";
import { useMixerShortcuts } from "@/hooks/useMixerShortcuts";
import { AppShell } from "@/components/layout/AppShell";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export default function App() {
  const isHydrated = useAppStore((s) => s.isHydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const syncWindowsAudioSessions = useMixerStore((s) => s.syncWindowsAudioSessions);
  const animationsEnabled = useAnimationsEnabled();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Synchronisation des sessions Windows au lancement et en arrière-plan
  useEffect(() => {
    void syncWindowsAudioSessions();
    const interval = setInterval(() => {
      void syncWindowsAudioSessions();
    }, 3000);
    return () => clearInterval(interval);
  }, [syncWindowsAudioSessions]);

  useTheme();
  usePickerBridge();
  useMixerShortcuts();

  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion={animationsEnabled ? undefined : "always"}>
        <TooltipProvider>
          <AnimatePresence mode="wait">
            {isHydrated ? <AppShell key="app" /> : <SplashScreen key="splash" />}
          </AnimatePresence>
        </TooltipProvider>
      </MotionConfig>
    </ErrorBoundary>
  );
}
