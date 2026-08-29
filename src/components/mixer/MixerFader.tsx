import React, { useEffect, useRef, useState, useCallback } from "react";
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
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Smooth ballistic decay for VU meter (instant attack, progressive smooth decay)
  const [meterLevel, setMeterLevel] = useState(0);
  const peakTargetRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isMuted || volume === 0) {
      peakTargetRef.current = 0;
    } else {
      peakTargetRef.current = Math.min(1, Math.max(0, livePeak));
    }
  }, [livePeak, isMuted, volume]);

  useEffect(() => {
    let current = 0;
    const updateMeter = () => {
      const target = peakTargetRef.current;
      if (target > current) {
        // Fast attack (instant jump to sound peak)
        current = target;
      } else {
        // Smooth exponential decay (smooth falloff)
        current = Math.max(0, current * 0.88 - 0.005);
      }
      setMeterLevel(current);
      animFrameRef.current = requestAnimationFrame(updateMeter);
    };

    animFrameRef.current = requestAnimationFrame(updateMeter);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Calculate volume from pointer Y position within the track
  const updateVolumeFromPointer = useCallback(
    (clientY: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const relativeY = clientY - rect.top;
      // 0 at bottom, 1 at top
      const ratio = 1 - Math.max(0, Math.min(1, relativeY / rect.height));
      const newVol = Math.round(ratio * 100);
      onVolumeChange(newVol);
    },
    [onVolumeChange]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateVolumeFromPointer(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateVolumeFromPointer(e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 3 : -3;
    const next = Math.max(0, Math.min(100, volume + delta));
    onVolumeChange(next);
  };

  const meterPercent = Math.min(100, Math.max(0, Math.round(meterLevel * 100)));

  return (
    <div className="flex flex-col items-center justify-between h-full w-full select-none py-1">
      {/* 1. Top Icon with Glowing Indicator Dot */}
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

      {/* 2. Vertical Slider & VU Meter Track */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        title={title || "Glisser pour régler le volume"}
        className="relative h-36 w-8 flex items-center justify-center cursor-ns-resize group my-1 touch-none"
      >
        {/* Background Track Groove */}
        <div className="absolute inset-x-2 inset-y-0 rounded-full bg-neutral-200 dark:bg-black/60 border border-neutral-300 dark:border-white/10 overflow-hidden shadow-inner">
          {/* LED VU Meter Bar (Smooth Green to Yellow to Red Gradient) */}
          <div
            className="absolute bottom-0 inset-x-0 rounded-full pointer-events-none"
            style={{
              height: `${meterPercent}%`,
              background: `linear-gradient(to top, #30D158 0%, #FFD60A 75%, #FF453A 95%)`,
              opacity: isMuted ? 0 : 0.85,
              boxShadow: meterPercent > 5 ? `0 0 10px ${accentColor}80` : undefined,
            }}
          />
        </div>

        {/* Custom Physical Hardware Fader Handle */}
        <div
          className={`absolute w-7 h-4 rounded-md bg-white dark:bg-[#2C2C2E] border border-neutral-400 dark:border-neutral-500 shadow-md pointer-events-none z-10 flex items-center justify-center transition-shadow ${
            isDragging ? "ring-2 ring-blue-500 shadow-lg scale-105" : ""
          }`}
          style={{
            bottom: `calc(${volume}% - 8px)`,
            boxShadow: `0 2px 6px rgba(0,0,0,0.4), 0 0 1px 1px ${accentColor}60`,
          }}
        >
          {/* Fader Center Ridge Line */}
          <div
            className="w-4 h-[2px] rounded-full transition-colors"
            style={{ backgroundColor: isMuted ? "#8E8E93" : accentColor }}
          />
        </div>
      </div>

      {/* 3. Numeric Percentage & Mute Button */}
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
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
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
