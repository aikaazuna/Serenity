import React from 'react';
import { motion } from 'framer-motion';
import { useAudioStore } from '@/state/audioStore';
import { useI18n } from '@/hooks/useI18n';
import {
  Sliders,
  Disc3,
  Sparkles,
  Activity,
  Headphones,
  ShieldCheck,
} from 'lucide-react';

export const AudioEffectsRack: React.FC = () => {
  const bassBoost = useAudioStore((s) => s.bassBoost) ?? 0;
  const setBassBoost = useAudioStore((s) => s.setBassBoost);
  const trebleAir = useAudioStore((s) => s.trebleAir) ?? 0;
  const setTrebleAir = useAudioStore((s) => s.setTrebleAir);
  const stereoBalance = useAudioStore((s) => s.stereoBalance) ?? 0;
  const setStereoBalance = useAudioStore((s) => s.setStereoBalance);
  const crossfeed = !!useAudioStore((s) => s.crossfeed);
  const toggleCrossfeed = useAudioStore((s) => s.toggleCrossfeed);
  const loudnessGuard = !!useAudioStore((s) => s.loudnessGuard);
  const toggleLoudnessGuard = useAudioStore((s) => s.toggleLoudnessGuard);
  const t = useI18n();

  const cardVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.97 },
    show: (i: number) => ({
      opacity: 1, y: 0, scale: 1,
      transition: { delay: i * 0.07, duration: 0.3, ease: [0.22, 1, 0.36, 1] }
    })
  };

  return (
    <div className="apple-card p-5 select-none space-y-4">
      <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#0A84FF]" />
          <h3 className="text-xs font-bold text-[color:var(--text-primary)] uppercase tracking-wider">
            {t.audio.rackTitle}
          </h3>
        </div>
        <span className="text-[11px] text-tertiary">
          {t.audio.rackSubtitle}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Sub-Bass Boost Card */}
        <motion.div variants={cardVariants} initial="hidden" animate="show" custom={0} className="apple-inner-box p-4 space-y-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Disc3 className="w-4 h-4 text-[#0A84FF]" />
              <span className="text-xs font-bold text-[color:var(--text-primary)]">
                {t.audio.bassBoost}
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-[#0A84FF]">
              +{Number(bassBoost || 0).toFixed(1)} dB
            </span>
          </div>
          <p className="text-[11px] text-tertiary">
            {t.audio.bassBoostDesc}
          </p>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={bassBoost}
            onChange={(e) => setBassBoost(parseFloat(e.target.value) || 0)}
            className="w-full h-1.5 bg-black/20 dark:bg-black/40 rounded-full appearance-none accent-[#0A84FF] cursor-pointer"
          />
        </motion.div>

        {/* Treble Air Card */}
        <motion.div variants={cardVariants} initial="hidden" animate="show" custom={1} className="apple-inner-box p-4 space-y-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              <span className="text-xs font-bold text-[color:var(--text-primary)]">
                {t.audio.trebleAir}
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-cyan-500 dark:text-cyan-400">
              +{Number(trebleAir || 0).toFixed(1)} dB
            </span>
          </div>
          <p className="text-[11px] text-tertiary">
            {t.audio.trebleAirDesc}
          </p>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={trebleAir}
            onChange={(e) => setTrebleAir(parseFloat(e.target.value) || 0)}
            className="w-full h-1.5 bg-black/20 dark:bg-black/40 rounded-full appearance-none accent-cyan-400 cursor-pointer"
          />
        </motion.div>

        {/* Balance Stéréo Card */}
        <motion.div variants={cardVariants} initial="hidden" animate="show" custom={2} className="apple-inner-box p-4 space-y-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500 dark:text-purple-400" />
              <span className="text-xs font-bold text-[color:var(--text-primary)]">
                {t.audio.stereoBalance}
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-purple-500 dark:text-purple-400">
              {stereoBalance === 0
                ? t.audio.center
                : stereoBalance < 0
                ? `L ${Math.abs(stereoBalance)}%`
                : `R ${stereoBalance}%`}
            </span>
          </div>
          <p className="text-[11px] text-tertiary">
            {t.audio.stereoBalanceDesc}
          </p>
          <input
            type="range"
            min="-100"
            max="100"
            step="5"
            value={stereoBalance}
            onChange={(e) => setStereoBalance(parseInt(e.target.value) || 0)}
            className="w-full h-1.5 bg-black/20 dark:bg-black/40 rounded-full appearance-none accent-purple-400 cursor-pointer"
          />
        </motion.div>

        {/* Crossfeed & Anti-Saturation Switch Card */}
        <motion.div variants={cardVariants} initial="hidden" animate="show" custom={3} className="apple-inner-box p-4 space-y-3 flex flex-col justify-center">
          {/* Crossfeed Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-secondary shrink-0" />
              <div>
                <span className="text-xs font-bold text-[color:var(--text-primary)] block leading-tight">
                  {t.audio.crossfeed}
                </span>
                <span className="text-[10px] text-tertiary">{t.audio.crossfeedDesc}</span>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={crossfeed}
              onClick={toggleCrossfeed}
              className={`w-11 h-6 rounded-full transition-colors duration-200 p-0.5 cursor-pointer shrink-0 flex items-center ${
                crossfeed ? 'bg-[#0A84FF]' : 'bg-black/25 dark:bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 transform ${
                  crossfeed ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Anti-Saturation Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-[color:var(--card-border-inner)]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-[color:var(--text-primary)] block leading-tight">
                  {t.audio.loudnessGuard}
                </span>
                <span className="text-[10px] text-tertiary">{t.audio.loudnessGuardDesc}</span>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={loudnessGuard}
              onClick={toggleLoudnessGuard}
              className={`w-11 h-6 rounded-full transition-colors duration-200 p-0.5 cursor-pointer shrink-0 flex items-center ${
                loudnessGuard ? 'bg-[#30D158]' : 'bg-black/25 dark:bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 transform ${
                  loudnessGuard ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
