import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useMixerStore } from "@/state/mixerStore";
import { MixerConsole } from "@/components/mixer/MixerConsole";
import { ChannelInspector } from "@/components/mixer/ChannelInspector";
import { MixerChannelSettingsModal } from "@/components/mixer/MixerChannelSettingsModal";
import { useMixerShortcuts } from "@/hooks/useMixerShortcuts";
import { Power, Tv } from "lucide-react";
import type { MixerChannelId } from "@/types/mixer";
import { useI18n } from "@/hooks/useI18n";

export const MixerPage: React.FC = () => {
  const t = useI18n();
  const mixerEnabled = useMixerStore((s) => s.mixerEnabled);
  const toggleMixerEnabled = useMixerStore((s) => s.toggleMixerEnabled);
  const streamerMode = useMixerStore((s) => s.streamerMode);
  const toggleStreamerMode = useMixerStore((s) => s.toggleStreamerMode);
  const syncWindowsAudioSessions = useMixerStore((s) => s.syncWindowsAudioSessions);
  const updatePeaks = useMixerStore((s) => s.updatePeaks);
  
  const [selectedChannelId, setSelectedChannelId] = useState<MixerChannelId>("master");

  // Activate global keyboard shortcuts listener
  useMixerShortcuts();

  // Periodically detect and sync active Windows audio sessions
  useEffect(() => {
    void syncWindowsAudioSessions();
    const interval = setInterval(() => {
      void syncWindowsAudioSessions();
    }, 3500);
    return () => clearInterval(interval);
  }, [syncWindowsAudioSessions]);

  // Real-time audio peak streaming from Windows CoreAudio (Smooth 20fps polling with local interpolation)
  useEffect(() => {
    let active = true;
    let isFetching = false;
    const pollPeaks = async () => {
      if (!active || isFetching || !(window as any).colorflow?.mixer?.getPeaks) return;
      isFetching = true;
      try {
        const peaks = await (window as any).colorflow.mixer.getPeaks();
        if (active && peaks) {
          updatePeaks(peaks);
        }
      } catch {
      } finally {
        isFetching = false;
      }
    };

    const interval = setInterval(() => {
      void pollPeaks();
    }, 50);

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
      {/* 1. Global Toolbar */}
      <div className="apple-card p-4 flex items-center justify-between border border-[color:var(--card-border)] bg-[color:var(--card-bg)] shadow-sm rounded-2xl">
        <h1 className="text-lg font-bold text-[color:var(--text-primary)] tracking-tight ml-2">Mixeur & Routage</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleStreamerMode}
            className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition shadow-xs ${
              streamerMode
                ? "bg-[#0A84FF]/15 border-[#0A84FF]/40 text-[#0A84FF]"
                : "bg-[color:var(--panel-bg)] border-[color:var(--panel-border)] text-secondary hover:text-[color:var(--text-primary)]"
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>{t.mixer.streamerMode}</span>
          </button>
          
          <button
            type="button"
            onClick={toggleMixerEnabled}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition shadow-xs ${
              mixerEnabled
                ? "bg-[#30D158]/15 border-[#30D158]/40 text-[#30D158]"
                : "bg-neutral-500/10 border-neutral-500/25 text-neutral-400"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>Mixer : {mixerEnabled ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>

      {!mixerEnabled && (
        <div className="apple-card p-4 border border-amber-500/30 bg-amber-500/5 rounded-2xl flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <Power className="w-4 h-4 text-amber-500" />
            <div>
              <span className="text-xs font-bold text-[color:var(--text-primary)] block">Le mixer audio est actuellement désactivé</span>
              <span className="text-[11px] text-secondary">Le son de vos applications passe en direct sans traitement.</span>
            </div>
          </div>
          <button type="button" onClick={toggleMixerEnabled} className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition cursor-pointer shadow-sm">Réactiver le mixer</button>
        </div>
      )}

      {/* 2. Main Workstation Area */}
      <div className={mixerEnabled ? "opacity-100 transition-opacity" : "opacity-40 pointer-events-none transition-opacity"}>
        <MixerConsole 
          selectedChannelId={selectedChannelId} 
          onSelectChannel={setSelectedChannelId} 
        />
        <ChannelInspector channelId={selectedChannelId} />
      </div>

      <MixerChannelSettingsModal />
    </motion.div>
  );
};
