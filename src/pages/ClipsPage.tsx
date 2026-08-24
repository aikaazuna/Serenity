import React from "react";
import { motion } from "framer-motion";
import {
  Film,
  Sparkles,
  Video,
  Mic,
  BellRing,
  Share2,
  Zap,
} from "lucide-react";
import { useAppStore } from "@/state/appStore";
import { useI18n } from "@/hooks/useI18n";

export const ClipsPage: React.FC = () => {
  const notify = useAppStore((s) => s.notify);
  const t = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6 pb-16 select-none max-w-5xl mx-auto w-full"
    >
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#2a1329] via-[#150a1b] to-black p-8 sm:p-10 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#BF5AF2] blur-3xl opacity-20 pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.clips.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
            {t.clips.title}
          </h1>

          <p className="text-sm text-gray-300 leading-relaxed">
            {t.clips.desc}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => notify(t.clips.title, "info")}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#BF5AF2] hover:bg-[#A845DC] text-white font-semibold text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>{t.clips.notifyMe}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Mockup Preview */}
      <div className="apple-card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-4">
          <div className="flex items-center gap-2.5">
            <Film className="w-5 h-5 text-[#BF5AF2]" />
            <h3 className="text-sm font-bold text-[color:var(--text-primary)] uppercase tracking-wider">
              {t.clips.previewTitle}
            </h3>
          </div>
          <span className="text-xs font-mono text-tertiary">{t.clips.previewVersion}</span>
        </div>

        {/* Mock Clip Timeline */}
        <div className="apple-inner-box p-6 rounded-2xl space-y-5 opacity-75 pointer-events-none">
          <div className="h-40 bg-black/20 dark:bg-black/40 rounded-xl flex items-center justify-center border border-dashed border-white/10 relative overflow-hidden">
            <Video className="w-10 h-10 text-tertiary opacity-40" />
            <span className="absolute bottom-3 right-3 text-[11px] font-mono font-bold text-white/70 bg-black/60 px-2 py-1 rounded">
              00:30 • 1080p 60 FPS
            </span>
          </div>

          {/* Multi-Track Preview */}
          <div className="space-y-2.5 pt-1">
            {/* Track: Video & Game */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-secondary font-medium">
                <span>{t.clips.track1}</span>
                <span className="font-mono text-tertiary">100%</span>
              </div>
              <div className="h-2 bg-black/20 dark:bg-black/40 rounded-full relative overflow-hidden">
                <div className="absolute inset-x-0 bg-[#0A84FF]/60 rounded-full" />
              </div>
            </div>

            {/* Track: Microphone */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-secondary font-medium">
                <span>{t.clips.track2}</span>
                <span className="font-mono text-tertiary">100%</span>
              </div>
              <div className="h-2 bg-black/20 dark:bg-black/40 rounded-full relative overflow-hidden">
                <div className="absolute inset-x-0 bg-[#30D158]/60 rounded-full" />
              </div>
            </div>

            {/* Track: Discord */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-secondary font-medium">
                <span>{t.clips.track3}</span>
                <span className="font-mono text-tertiary">100%</span>
              </div>
              <div className="h-2 bg-black/20 dark:bg-black/40 rounded-full relative overflow-hidden">
                <div className="absolute inset-x-0 bg-[#BF5AF2]/60 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="apple-card p-5 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-[#BF5AF2]/15 text-[#BF5AF2] flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-[color:var(--text-primary)]">{t.clips.feature1Title}</h4>
          <p className="text-xs text-secondary leading-relaxed">
            {t.clips.feature1Desc}
          </p>
        </div>

        <div className="apple-card p-5 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-[#0A84FF]/15 text-[#0A84FF] flex items-center justify-center">
            <Mic className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-[color:var(--text-primary)]">{t.clips.feature2Title}</h4>
          <p className="text-xs text-secondary leading-relaxed">
            {t.clips.feature2Desc}
          </p>
        </div>

        <div className="apple-card p-5 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
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
