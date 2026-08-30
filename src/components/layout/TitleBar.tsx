import { useState } from "react";
import { Search, Pipette, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { isElectron } from "@/lib/utils";
import { useUiStore } from "@/state/uiStore";
import { useAppStore } from "@/state/appStore";
import { useAudioStore } from "@/state/audioStore";
import { useI18n } from "@/hooks/useI18n";
import { useAnimationsEnabled } from "@/hooks/useAnimations";
import { useWindowState } from "@/hooks/useWindowState";
import { startPicker } from "@/hooks/usePickerBridge";
import { Kbd } from "@/components/ui/Kbd";
import appLogo from "@/assets/logo.png";

export function TitleBar() {
  const openSearch = useUiStore((s) => s.openSearch);
  const setWindowTransition = useUiStore((s) => s.setWindowTransition);
  const activeColorHex = useAppStore((s) => s.activeColorHex);
  const eqEnabled = useAudioStore((s) => s.eqEnabled);
  const toggleEqEnabled = useAudioStore((s) => s.toggleEqEnabled);
  const activePresetName = useAudioStore((s) => s.activePresetName);
  const t = useI18n();
  const animationsEnabled = useAnimationsEnabled();
  const { isMaximized } = useWindowState();
  const [trafficHovered, setTrafficHovered] = useState(false);

  const runWindowAction = (transition: "minimize" | "maximize", action: () => void) => {
    if (!animationsEnabled) {
      action();
      return;
    }
    setWindowTransition(transition);
    window.setTimeout(() => {
      action();
      setWindowTransition(null);
    }, transition === "minimize" ? 180 : 140);
  };

  return (
    <div className="drag-region flex h-[52px] shrink-0 items-center justify-between border-b border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] px-5 backdrop-blur-2xl select-none">
      {/* Left: macOS Traffic Lights & Brand */}
      <div className="flex items-center gap-7 pl-1">
        {isElectron() && (
          <div
            className="no-drag flex items-center gap-2.5 pr-1"
            onMouseEnter={() => setTrafficHovered(true)}
            onMouseLeave={() => setTrafficHovered(false)}
          >
            {/* Close */}
            <button
              onClick={() => window.serenity.window.close()}
              aria-label={t.window.close}
              className="group relative flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#FF5F56] transition-transform hover:scale-110 active:scale-95 shadow-sm cursor-pointer"
            >
              <span
                className={`text-[9px] font-bold leading-none text-[#7D0000] opacity-0 transition-opacity ${
                  trafficHovered ? "opacity-100" : ""
                }`}
              >
                ✕
              </span>
            </button>
            {/* Minimize */}
            <button
              onClick={() =>
                runWindowAction("minimize", () => window.serenity.window.minimize())
              }
              aria-label={t.window.minimize}
              className="group relative flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#FFBD2E] transition-transform hover:scale-110 active:scale-95 shadow-sm cursor-pointer"
            >
              <span
                className={`text-[9px] font-bold leading-none text-[#995700] opacity-0 transition-opacity ${
                  trafficHovered ? "opacity-100" : ""
                }`}
              >
                –
              </span>
            </button>
            {/* Maximize / Zoom */}
            <button
              onClick={() =>
                runWindowAction("maximize", () => window.serenity.window.toggleMaximize())
              }
              aria-label={isMaximized ? t.window.restore : t.window.maximize}
              className="group relative flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#27C93F] transition-transform hover:scale-110 active:scale-95 shadow-sm cursor-pointer"
            >
              <span
                className={`text-[8px] font-bold leading-none text-[#006500] opacity-0 transition-opacity ${
                  trafficHovered ? "opacity-100" : ""
                }`}
              >
                +
              </span>
            </button>
          </div>
        )}

        <div className="flex items-center">
          <img
            src={appLogo}
            alt="Serenity"
            className="h-[22px] w-auto max-w-[150px] select-none object-contain drop-shadow-sm transition-all"
            style={{ filter: "var(--logo-filter, none)" }}
            draggable={false}
          />
        </div>
      </div>

      {/* Center: Search Field */}
      <button
        onClick={openSearch}
        className="no-drag group flex h-[34px] w-[350px] max-w-md items-center gap-2.5 rounded-full border border-[color:var(--card-border)] bg-[color:var(--input-bg)] px-3.5 text-xs text-secondary transition hover:border-[color:var(--panel-border-strong)] hover:bg-[color:var(--panel-bg-hover)] focus-ring shadow-sm cursor-pointer"
      >
        <Search className="h-3.5 w-3.5 text-tertiary transition group-hover:text-secondary shrink-0" />
        <span className="flex-1 text-left text-[12px] text-tertiary truncate whitespace-nowrap">
          {t.search?.placeholder || "Rechercher dans Serenity…"}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </div>
      </button>

      {/* Right: Quick Action Controls */}
      <div className="no-drag flex items-center gap-2.5">
        {/* Quick Pipette Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => void startPicker()}
          className="flex h-[34px] items-center gap-2 rounded-xl border border-[color:var(--card-border)] bg-[color:var(--btn-secondary-bg)] px-3.5 text-[12px] font-medium text-secondary transition hover:bg-[color:var(--btn-secondary-hover)] hover:text-[color:var(--text-primary)] shadow-sm cursor-pointer"
          title={t.titleBar.launchPicker}
        >
          <span
            className="h-3 w-3 rounded-full border border-black/20 shadow-sm"
            style={{ backgroundColor: activeColorHex }}
          />
          <Pipette className="h-3.5 w-3.5" />
          <span>{t.titleBar.picker}</span>
        </motion.button>

        {/* Quick Audio EQ Master Toggle */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleEqEnabled}
          className={`flex h-[34px] items-center gap-2 rounded-xl border px-3.5 text-[12px] font-medium transition shadow-sm cursor-pointer ${
            eqEnabled
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-500 dark:text-emerald-400"
              : "border-[color:var(--card-border)] bg-[color:var(--btn-secondary-bg)] text-tertiary hover:text-secondary"
          }`}
          title={eqEnabled ? "Égaliseur activé (Cliquer pour désactiver)" : "Égaliseur désactivé"}
        >
          {eqEnabled ? (
            <>
              <Volume2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>{t.titleBar.eqActive}</span>
              {activePresetName && (
                <span className="max-w-[90px] truncate text-[11px] opacity-80 font-normal">
                  ({activePresetName})
                </span>
              )}
            </>
          ) : (
            <>
              <VolumeX className="h-3.5 w-3.5" />
              <span>EQ Bypass</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
