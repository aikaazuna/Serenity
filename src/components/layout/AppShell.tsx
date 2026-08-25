import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { TitleBar } from "./TitleBar";
import { Sidebar } from "./Sidebar";
import { useUiStore, type PageId } from "@/state/uiStore";
import { useAnimationsEnabled } from "@/hooks/useAnimations";
import { useWindowState } from "@/hooks/useWindowState";

import { DiscoverHubPage } from "@/pages/DiscoverHubPage";
import { HomePage } from "@/pages/HomePage";
import { PalettesPage } from "@/pages/PalettesPage";
import { GradientStudioPage } from "@/pages/GradientStudioPage";
import { ImageExtractorPage } from "@/pages/ImageExtractorPage";
import { AccessibilityPage } from "@/pages/AccessibilityPage";
import { LibraryPage } from "@/pages/LibraryPage";

import { AudioPage } from "@/pages/AudioPage";
import { PresetsLibrary } from "@/components/audio/PresetsLibrary";
import { AudioTestPage } from "@/pages/AudioTestPage";
import { AudioProfilesPage } from "@/pages/AudioProfilesPage";
import { MixerPage } from "@/pages/MixerPage";
import { ClipsPage } from "@/pages/ClipsPage";

import { SettingsPage } from "@/pages/SettingsPage";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { CaptureFlashOverlay } from "@/components/color/CaptureFlashOverlay";
import { CommandPalette } from "@/components/search/CommandPalette";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { cn } from "@/lib/utils";

const PAGES: Record<PageId, React.ComponentType> = {
  hub: DiscoverHubPage,
  color: HomePage,
  palettes: PalettesPage,
  gradients: GradientStudioPage,
  "image-extract": ImageExtractorPage,
  accessibility: AccessibilityPage,
  library: LibraryPage,
  "audio-eq": AudioPage,
  "audio-presets": PresetsLibrary,
  "audio-lab": AudioTestPage,
  "audio-profiles": AudioProfilesPage,
  mixer: MixerPage,
  clips: ClipsPage,
  settings: SettingsPage,
};

export function AppShell() {
  const activePage = useUiStore((s) => s.activePage);
  const windowTransition = useUiStore((s) => s.windowTransition);
  const animationsEnabled = useAnimationsEnabled();
  const { isMaximized } = useWindowState();
  const ActivePageComponent = PAGES[activePage] || DiscoverHubPage;


  return (
    <MotionConfig reducedMotion={animationsEnabled ? undefined : "always"}>
      <motion.div
        layout={animationsEnabled}
        animate={{
          borderRadius: isMaximized ? 0 : 20,
          scale: windowTransition === "minimize" ? 0.96 : 1,
          opacity: windowTransition === "minimize" ? 0.82 : 1,
        }}
        transition={{
          duration: animationsEnabled ? 0.22 : 0,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={cn(
          "app-gradient-bg flex h-screen w-screen flex-col overflow-hidden text-[color:var(--text-primary)] transition-all",
          isMaximized ? "rounded-none border-0" : "rounded-[20px] border border-[color:var(--panel-border-strong)] shadow-2xl",
        )}
      >
        <TitleBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto px-8 sm:px-12 lg:px-14 py-8">
            <ErrorBoundary>
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={activePage}
                  initial={animationsEnabled ? { opacity: 0, y: 14, scale: 0.99 } : false}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={animationsEnabled ? { opacity: 0, y: -8, scale: 0.99 } : undefined}
                  transition={animationsEnabled ? { duration: 0.25, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}
                  className="max-w-6xl mx-auto w-full"
                >
                  <ActivePageComponent />
                </motion.div>
              </AnimatePresence>
            </ErrorBoundary>
          </main>
        </div>

        <NotificationCenter />
        <CaptureFlashOverlay />
        <CommandPalette />
      </motion.div>
    </MotionConfig>
  );
}
