import React from "react";
import { motion } from "framer-motion";
import {
  SlidersHorizontal,
  Sparkles,
  Volume2,
  Mic2,
  Gamepad2,
  Music,
  Headphones,
  BellRing,
  CheckCircle2,
} from "lucide-react";
import { useAppStore } from "@/state/appStore";
import { useI18n } from "@/hooks/useI18n";

export const MixerPage: React.FC = () => {
  const notify = useAppStore((s) => s.notify);
  const t = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6 pb-16 select-none max-w-5xl mx-auto w-full"
    >
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#111c2e] via-[#09101d] to-black p-8 sm:p-10 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#0A84FF] blur-3xl opacity-20 pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.mixer.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
            {t.mixer.title}
          </h1>

          <p className="text-sm text-gray-300 leading-relaxed">
            {t.mixer.desc}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => notify(t.mixer.title, "info")}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0A84FF] hover:bg-[#0071E3] text-white font-semibold text-xs rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>{t.mixer.notifyMe}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive / Visual Preview Teaser */}
      <div className="apple-card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-4">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="w-5 h-5 text-[#0A84FF]" />
            <h3 className="text-sm font-bold text-[color:var(--text-primary)] uppercase tracking-wider">
              {t.mixer.previewTitle}
            </h3>
          </div>
          <span className="text-xs font-mono text-tertiary">{t.mixer.previewVersion}</span>
        </div>

        {/* Mock Faders Rack */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 opacity-75 pointer-events-none">
          {/* Track 1: Master */}
          <div className="apple-inner-box p-4 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#0A84FF]" />
                <span className="text-xs font-bold text-[color:var(--text-primary)]">Master</span>
              </div>
              <span className="text-xs font-mono font-bold text-[#0A84FF]">100%</span>
            </div>
            <div className="h-32 bg-black/10 dark:bg-black/30 rounded-xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute bottom-0 inset-x-0 bg-[#0A84FF]/20 h-[80%]" />
              <div className="w-full h-2 bg-[#0A84FF] rounded-full mx-4 shadow-sm" />
            </div>
            <span className="text-[10px] text-center text-tertiary">{t.mixer.masterTrack}</span>
          </div>

          {/* Track 2: Game */}
          <div className="apple-inner-box p-4 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-[color:var(--text-primary)]">Gaming</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-500">85%</span>
            </div>
            <div className="h-32 bg-black/10 dark:bg-black/30 rounded-xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute bottom-0 inset-x-0 bg-emerald-500/20 h-[70%]" />
              <div className="w-full h-2 bg-emerald-500 rounded-full mx-4 shadow-sm" />
            </div>
            <span className="text-[10px] text-center text-tertiary">{t.mixer.gameTrack}</span>
          </div>

          {/* Track 3: Voice / Chat */}
          <div className="apple-inner-box p-4 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic2 className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-bold text-[color:var(--text-primary)]">Discord</span>
              </div>
              <span className="text-xs font-mono font-bold text-purple-500">90%</span>
            </div>
            <div className="h-32 bg-black/10 dark:bg-black/30 rounded-xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute bottom-0 inset-x-0 bg-purple-500/20 h-[75%]" />
              <div className="w-full h-2 bg-purple-500 rounded-full mx-4 shadow-sm" />
            </div>
            <span className="text-[10px] text-center text-tertiary">{t.mixer.discordTrack}</span>
          </div>

          {/* Track 4: Music */}
          <div className="apple-inner-box p-4 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-[color:var(--text-primary)]">Music</span>
              </div>
              <span className="text-xs font-mono font-bold text-amber-500">60%</span>
            </div>
            <div className="h-32 bg-black/10 dark:bg-black/30 rounded-xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute bottom-0 inset-x-0 bg-amber-500/20 h-[50%]" />
              <div className="w-full h-2 bg-amber-500 rounded-full mx-4 shadow-sm" />
            </div>
            <span className="text-[10px] text-center text-tertiary">{t.mixer.musicTrack}</span>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="apple-card p-5 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-[#0A84FF]/15 text-[#0A84FF] flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-[color:var(--text-primary)]">{t.mixer.feature1Title}</h4>
          <p className="text-xs text-secondary leading-relaxed">
            {t.mixer.feature1Desc}
          </p>
        </div>

        <div className="apple-card p-5 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <Headphones className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-[color:var(--text-primary)]">{t.mixer.feature2Title}</h4>
          <p className="text-xs text-secondary leading-relaxed">
            {t.mixer.feature2Desc}
          </p>
        </div>

        <div className="apple-card p-5 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-[color:var(--text-primary)]">{t.mixer.feature3Title}</h4>
          <p className="text-xs text-secondary leading-relaxed">
            {t.mixer.feature3Desc}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
