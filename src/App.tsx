import { useEffect } from "react";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { useAppStore } from "@/state/appStore";
import { useTheme } from "@/hooks/useTheme";
import { usePickerBridge } from "@/hooks/usePickerBridge";
import { useAnimationsEnabled } from "@/hooks/useAnimations";
import { AppShell } from "@/components/layout/AppShell";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

export default function App() {
  const isHydrated = useAppStore((s) => s.isHydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const animationsEnabled = useAnimationsEnabled();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useTheme();
  usePickerBridge();

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
