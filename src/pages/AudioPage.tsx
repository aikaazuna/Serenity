import React from "react";
import { motion } from "framer-motion";
import { useAudioStore } from "@/state/audioStore";
import { AudioHeader } from "@/components/audio/AudioHeader";
import { InteractiveCurveRenderer } from "@/components/audio/InteractiveCurveRenderer";
import { AudioEffectsRack } from "@/components/audio/AudioEffectsRack";
import { GraphicEQ } from "@/components/audio/GraphicEQ";
import { ParametricEQ } from "@/components/audio/ParametricEQ";
import { PresetsLibrary } from "@/components/audio/PresetsLibrary";
import { Sliders, Activity } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

export const AudioPage: React.FC = () => {
  const mode = useAudioStore((s) => s.mode);
  const setMode = useAudioStore((s) => s.setMode);
  const t = useI18n();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, staggerChildren: 0.1 }}
      className="flex flex-col gap-6 pb-16 select-none w-full"
    >
      {/* Audio Header: Device, Channel & Master Preamp */}
      <AudioHeader />

      {/* Interactive Response Curve (60fps Canvas) */}
      <InteractiveCurveRenderer />

      {/* DSP Effects Rack (Bass Boost, Air, Balance, Crossfeed) */}
      <AudioEffectsRack />

      {/* EQ Mode Switcher */}
      <div className="flex items-center justify-between">
        <div className="apple-inner-box flex items-center p-1.5 rounded-2xl gap-1.5">
          <button
            onClick={() => setMode("parametric")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              mode === "parametric"
                ? "bg-[#0A84FF] text-white shadow-sm"
                : "text-secondary hover:text-[color:var(--text-primary)]"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{t.audio.parametricEq}</span>
          </button>

          <button
            onClick={() => setMode("graphic")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              mode === "graphic"
                ? "bg-[#0A84FF] text-white shadow-sm"
                : "text-secondary hover:text-[color:var(--text-primary)]"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{t.audio.graphicEq}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Editor Panel */}
      {mode === "parametric" ? <ParametricEQ /> : <GraphicEQ />}

      {/* Presets & AutoEQ Library */}
      <PresetsLibrary />
    </motion.div>
  );
};
