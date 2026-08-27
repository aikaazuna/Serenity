import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useMixerStore } from "@/state/mixerStore";
import { MixerTopNav } from "@/components/mixer/MixerTopNav";
import { MixerConsole } from "@/components/mixer/MixerConsole";
import { MixerChannelDetail } from "@/components/mixer/MixerChannelDetail";
import { MixerStudio } from "@/components/mixer/MixerStudio";
import { MixerChannelSettingsModal } from "@/components/mixer/MixerChannelSettingsModal";
import { useMixerShortcuts } from "@/hooks/useMixerShortcuts";
import { Power } from "lucide-react";

export const MixerPage: React.FC = () => {
  const activeTab = useMixerStore((s) => s.activeTab);
  const mixerEnabled = useMixerStore((s) => s.mixerEnabled);
  const toggleMixerEnabled = useMixerStore((s) => s.toggleMixerEnabled);
  const syncWindowsAudioSessions = useMixerStore((s) => s.syncWindowsAudioSessions);
  const updatePeaks = useMixerStore((s) => s.updatePeaks);

  // Activate global keyboard shortcuts listener
  useMixerShortcuts();

  // Periodically detect and sync active Windows audio sessions (Discord, Spotify, games...)
  useEffect(() => {
    void syncWindowsAudioSessions();
    const interval = setInterval(() => {
      void syncWindowsAudioSessions();
    }, 3500);
    return () => clearInterval(interval);
  }, [syncWindowsAudioSessions]);

  // Real-time audio peak streaming from Windows CoreAudio
  useEffect(() => {
    let active = true;
    const pollPeaks = async () => {
      if (!active || !(window as any).colorflow?.mixer?.getPeaks) return;
      try {
        const peaks = await (window as any).colorflow.mixer.getPeaks();
        if (active && peaks) {
          updatePeaks(peaks);
        }
      } catch {}
    };

    const interval = setInterval(() => {
      void pollPeaks();
    }, 150);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [updatePeaks]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-5 pb-16 select-none max-w-7xl mx-auto w-full"
    >
      {/* 1. Sub-navigation Bar (Mixer | Game | Chat | Média | Aux | Micro + Streamer Mode Switch + Master Power) */}
      <div className="apple-card p-4 sm:p-5 border border-[color:var(--card-border)] bg-[color:var(--card-bg)] shadow-sm">
        <MixerTopNav />
      </div>

      {/* Mixer Bypassed Warning if disabled */}
      {!mixerEnabled && (
        <div className="apple-card p-4 border border-amber-500/30 bg-amber-500/5 rounded-2xl flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <Power className="w-4 h-4 text-amber-500" />
            <div>
              <span className="text-xs font-bold text-[color:var(--text-primary)] block">
                Le mixer audio est actuellement désactivé
              </span>
              <span className="text-[11px] text-secondary">
                Le son de vos applications passe en direct sans traitement ni fader.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleMixerEnabled}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition cursor-pointer shadow-sm"
          >
            Réactiver le mixer
          </button>
        </div>
      )}

      {/* 2. Main Workstation Area */}
      <div className={mixerEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}>
        {activeTab === "mixer" ? (
          <MixerConsole />
        ) : activeTab === "studio" ? (
          <MixerStudio />
        ) : (
          <MixerChannelDetail channelId={activeTab as import("@/types/mixer").MixerChannelId} />
        )}
      </div>

      {/* 3. Per-Channel Shortcut and Routing Modal (Drawer / Popover) */}
      <MixerChannelSettingsModal />
    </motion.div>
  );
};
