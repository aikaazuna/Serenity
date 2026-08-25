import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Film,
  Video,
  Mic,
  Share2,
  Zap,
  Play,
  Pause,
} from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

export const ClipsPage: React.FC = () => {
  const t = useI18n();

  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadPos, setPlayheadPos] = useState(18);

  const formatSeconds = (sec: number) => {
    const s = Math.round(sec);
    return `00:${s < 10 ? `0${s}` : s}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6 pb-16 select-none max-w-5xl mx-auto w-full"
    >
      {/* Workstation Teaser Header */}
      <div className="apple-card p-6 sm:p-7 relative overflow-hidden space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#BF5AF2]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
              {t.clips.sectionSubtitle}
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-[#BF5AF2] bg-[#BF5AF2]/10 px-2.5 py-0.5 rounded-md">
            {t.clips.roadmapBadge}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-[color:var(--text-primary)] tracking-tight">
          {t.clips.title}
        </h1>

        <p className="text-xs text-secondary max-w-3xl leading-relaxed">
          {t.clips.desc}
        </p>
      </div>

      {/* Interactive Timeline Workstation */}
      <div className="apple-card p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
          <div className="flex items-center gap-2.5">
            <Film className="w-4 h-4 text-[#BF5AF2]" />
            <h3 className="text-xs font-bold text-[color:var(--text-primary)] uppercase tracking-wider">
              {t.clips.previewTitle}
            </h3>
          </div>
          <span className="text-xs text-tertiary">{t.clips.timelinePreview}</span>
        </div>

        {/* Video Canvas & Multi-Track Scrubber */}
        <div className="apple-inner-box p-5 rounded-2xl space-y-4">
          {/* Mock Viewport */}
          <div className="h-44 bg-black/25 dark:bg-black/45 rounded-xl flex items-center justify-center border border-[color:var(--card-border-inner)] relative overflow-hidden group">
            <div className="flex flex-col items-center gap-2 text-tertiary">
              <Video className="w-8 h-8 opacity-60" />
              <span className="text-xs font-medium">{t.clips.replayActive}</span>
            </div>

            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition cursor-pointer"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
              </button>
              <span className="font-mono text-xs font-bold text-white/90 bg-black/60 px-2 py-1 rounded-md">
                {formatSeconds(playheadPos)} / 00:30
              </span>
            </div>

            <span className="absolute top-3 right-3 text-[10.5px] font-mono font-bold text-white/80 bg-black/60 px-2 py-0.5 rounded-md">
              1080p 60 FPS • AV1
            </span>
          </div>

          {/* Timeline Tracks */}
          <div className="space-y-2.5 pt-2">
            {/* Scrubber Bar */}
            <div className="relative flex items-center">
              <input
                type="range"
                min={0}
                max={30}
                step={0.1}
                value={playheadPos}
                onChange={(e) => setPlayheadPos(Number(e.target.value))}
                className="w-full accent-[#BF5AF2] h-1.5 bg-black/20 dark:bg-black/50 rounded-full cursor-pointer"
              />
            </div>

            {/* Track 1: Game Video */}
            <div className="apple-inner-box p-2.5 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2 w-2 rounded-full bg-[#0A84FF] shrink-0" />
                <span className="text-xs font-semibold text-[color:var(--text-primary)] truncate">
                  {t.clips.track1}
                </span>
              </div>
              <div className="h-3 flex-1 bg-[#0A84FF]/25 rounded-md overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 bg-[#0A84FF]/60 w-[90%] rounded-md" />
              </div>
            </div>

            {/* Track 2: Microphone */}
            <div className="apple-inner-box p-2.5 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2 w-2 rounded-full bg-[#30D158] shrink-0" />
                <span className="text-xs font-semibold text-[color:var(--text-primary)] truncate">
                  {t.clips.track2}
                </span>
              </div>
              <div className="h-3 flex-1 bg-[#30D158]/25 rounded-md overflow-hidden relative">
                <div className="absolute inset-y-0 left-[20%] bg-[#30D158]/60 w-[60%] rounded-md" />
              </div>
            </div>

            {/* Track 3: Discord Chat */}
            <div className="apple-inner-box p-2.5 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2 w-2 rounded-full bg-[#BF5AF2] shrink-0" />
                <span className="text-xs font-semibold text-[color:var(--text-primary)] truncate">
                  {t.clips.track3}
                </span>
              </div>
              <div className="h-3 flex-1 bg-[#BF5AF2]/25 rounded-md overflow-hidden relative">
                <div className="absolute inset-y-0 left-[10%] bg-[#BF5AF2]/60 w-[75%] rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="apple-card p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-[#BF5AF2]/15 text-[#BF5AF2] flex items-center justify-center">
            <Zap className="w-4.5 h-4.5" />
          </div>
          <h4 className="text-xs font-bold text-[color:var(--text-primary)]">{t.clips.feature1Title}</h4>
          <p className="text-xs text-secondary leading-relaxed">
            {t.clips.feature1Desc}
          </p>
        </div>

        <div className="apple-card p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-[#0A84FF]/15 text-[#0A84FF] flex items-center justify-center">
            <Mic className="w-4.5 h-4.5" />
          </div>
          <h4 className="text-xs font-bold text-[color:var(--text-primary)]">{t.clips.feature2Title}</h4>
          <p className="text-xs text-secondary leading-relaxed">
            {t.clips.feature2Desc}
          </p>
        </div>

        <div className="apple-card p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <Share2 className="w-4.5 h-4.5" />
          </div>
          <h4 className="text-xs font-bold text-[color:var(--text-primary)]">{t.clips.feature3Title}</h4>
          <p className="text-xs text-secondary leading-relaxed">
            {t.clips.feature3Desc}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
