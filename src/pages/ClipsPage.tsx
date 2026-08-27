import React from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Mic,
  Share2,
} from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { ClipsAudioMixer } from "@/components/clips/ClipsAudioMixer";

export const ClipsPage: React.FC = () => {
  const t = useI18n();

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

      {/* Real Multi-Track Clips Audio Workstation */}
      <ClipsAudioMixer />

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
