import React from "react";
import { Volume2, VolumeX } from "lucide-react";

interface MixerFaderProps {
  icon: React.ElementType;
  volume: number;
  isMuted: boolean;
  accentColor: string;
  onVolumeChange: (val: number) => void;
  onToggleMute: () => void;
  title?: string;
  isStream?: boolean;
  livePeak?: number;
}

export const MixerFader: React.FC<MixerFaderProps> = ({
  icon: Icon,
  volume,
  isMuted,
  accentColor,
  onVolumeChange,
  onToggleMute,
  title,
  livePeak = 0,
}) => {
  // Real-time audio peak calculation from Windows CoreAudio
  const meterLevel = isMuted || volume === 0 ? 0 : Math.min(100, Math.max(0, Math.round(livePeak * 100)));

  return (
    <div className="flex flex-col items-center justify-between h-full w-full select-none py-1">
      {/* Top Icon with Status Dot */}
      <div className="flex flex-col items-center gap-1 shrink-0 mb-1">
        <Icon
          className="w-4 h-4 transition-colors"
          style={{ color: isMuted ? "#8E8E93" : accentColor }}
        />
        <div
          className={`w-1.5 h-1.5 rounded-full transition-all ${
            isMuted
              ? "bg-neutral-400 dark:bg-neutral-600 opacity-40"
              : "opacity-100"
          }`}
          style={{
            backgroundColor: isMuted ? undefined : accentColor,
            boxShadow: isMuted ? undefined : `0 0 6px ${accentColor}`,
          }}
        />
      </div>

      {/* Vertical Slider & VU Meter Track (Comfortable 144px height) */}
      <div className="relative h-36 w-7 flex items-center justify-center group my-1">
        {/* Background Track Groove (Clean Contrast in Light & Dark) */}
        <div className="absolute inset-x-2.5 inset-y-0 rounded-full bg-neutral-200 dark:bg-black/50 border border-neutral-300 dark:border-white/10 overflow-hidden shadow-inner">
          {/* LED VU Meter Bar (Green to Yellow to Red) */}
          <div
            className="absolute bottom-0 inset-x-0 transition-all duration-100 rounded-full"
            style={{
              height: `${meterLevel}%`,
              background: `linear-gradient(to top, ${accentColor}cc 0%, ${accentColor} 70%, #ff3b30 95%)`,
              opacity: isMuted ? 0 : 0.85,
            }}
          />
        </div>

        {/* Real HTML Range Slider rotated -90deg */}
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          aria-label={title || "Volume"}
          className="absolute w-36 h-7 -rotate-90 cursor-pointer opacity-0 z-20"
        />

        {/* Custom Hardware Fader Handle Thumb */}
        <div
          className="absolute w-6 h-3.5 rounded-md bg-white dark:bg-[#2C2C2E] border border-neutral-400 dark:border-neutral-600 shadow-md pointer-events-none z-10 transition-transform duration-75 flex items-center justify-center"
          style={{
            bottom: `calc(${volume}% - 7px)`,
            boxShadow: `0 2px 5px rgba(0,0,0,0.35), 0 0 1px 1px ${accentColor}40`,
          }}
        >
          {/* Fader Center Ridge Line */}
          <div className="w-3.5 h-[1.5px] bg-neutral-400 dark:bg-neutral-500 rounded-full" />
        </div>
      </div>

      {/* Numeric Percentage & Mute Button with comfortable spacing */}
      <div className="flex flex-col items-center gap-1.5 shrink-0 mt-1">
        <span
          className={`font-mono text-[11px] font-bold tabular-nums transition-colors ${
            isMuted ? "text-neutral-400 dark:text-neutral-500 line-through" : "text-[color:var(--text-primary)]"
          }`}
        >
          {isMuted ? "0%" : `${volume}%`}
        </span>

        <button
          type="button"
          onClick={onToggleMute}
          title={isMuted ? "Activer le son" : "Couper le son"}
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition shadow-xs cursor-pointer border ${
            isMuted
              ? "bg-red-500/15 border-red-500/30 text-red-500 dark:text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.25)]"
              : "apple-inner-box text-secondary hover:text-[color:var(--text-primary)]"
          }`}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
