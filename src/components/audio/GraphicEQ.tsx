import React from "react";
import { useAudioStore } from "@/state/audioStore";
import { useI18n } from "@/hooks/useI18n";
import { EQEngine } from "@/lib/eq-engine";
import {
  Minus,
  TrendingUp,
  Volume2,
  Sparkles,
  Waves,
  RefreshCw,
} from "lucide-react";

export const GraphicEQ: React.FC = () => {
  const graphicBands = useAudioStore((s) => s.graphicBands) || 10;
  const setGraphicBands = useAudioStore((s) => s.setGraphicBands);
  const graphicFilters = useAudioStore((s) => s.graphicFilters) || {};
  const setGraphicFilter = useAudioStore((s) => s.setGraphicFilter);
  const quickCurveAction = useAudioStore((s) => s.quickCurveAction);
  const t = useI18n();

  const frequencies = EQEngine.getBands(graphicBands);

  const formatFreqPill = (freq: number) => {
    if (freq >= 1000) {
      const k = freq / 1000;
      return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
    }
    return `${freq}`;
  };

  return (
    <div className="apple-card p-5 select-none space-y-4">
      {/* Top Bar: Band Selector & Shape Macros */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--card-border)] pb-3">
        {/* Band Count Segmented Control */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-secondary">{t.graphicEqUI.bands}</span>
          <div className="apple-inner-box flex items-center p-1 rounded-xl gap-1">
            {[5, 10, 15, 20, 31].map((b) => (
              <button
                key={b}
                onClick={() => setGraphicBands(b)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  graphicBands === b
                    ? "bg-[#0A84FF] text-white shadow-sm"
                    : "text-secondary hover:text-[color:var(--text-primary)]"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Shape Presets Macros with Icons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => quickCurveAction("flat")}
            className="apple-inner-box flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-secondary hover:text-[color:var(--text-primary)] transition cursor-pointer"
            title={t.graphicEqUI.flatDesc}
          >
            <Minus className="h-3 w-3" />
            <span>{t.graphicEqUI.flat}</span>
          </button>

          <button
            onClick={() => quickCurveAction("v-shape")}
            className="apple-inner-box flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-secondary hover:text-[color:var(--text-primary)] transition cursor-pointer"
            title={t.graphicEqUI.vShapeDesc}
          >
            <TrendingUp className="h-3 w-3 text-cyan-500" />
            <span>{t.graphicEqUI.vShape}</span>
          </button>

          <button
            onClick={() => quickCurveAction("bass")}
            className="apple-inner-box flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-secondary hover:text-[color:var(--text-primary)] transition cursor-pointer"
            title={t.graphicEqUI.bassDesc}
          >
            <Volume2 className="h-3 w-3 text-[#0A84FF]" />
            <span>{t.graphicEqUI.bass}</span>
          </button>

          <button
            onClick={() => quickCurveAction("treble")}
            className="apple-inner-box flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-secondary hover:text-[color:var(--text-primary)] transition cursor-pointer"
            title={t.graphicEqUI.trebleDesc}
          >
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>{t.graphicEqUI.treble}</span>
          </button>

          <button
            onClick={() => quickCurveAction("smooth")}
            className="apple-inner-box flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-secondary hover:text-[color:var(--text-primary)] transition cursor-pointer"
            title={t.graphicEqUI.smoothDesc}
          >
            <Waves className="h-3 w-3 text-emerald-500" />
            <span>{t.graphicEqUI.smooth}</span>
          </button>

          <button
            onClick={() => quickCurveAction("invert")}
            className="apple-inner-box flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-secondary hover:text-[color:var(--text-primary)] transition cursor-pointer"
            title={t.graphicEqUI.invertDesc}
          >
            <RefreshCw className="h-3 w-3 text-purple-500" />
            <span>{t.graphicEqUI.invert}</span>
          </button>
        </div>
      </div>

      {/* Faders Grid — Laser-Aligned Columns */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div
          className="flex items-center justify-between gap-1 sm:gap-2 px-2 py-4"
          style={{ minWidth: graphicBands > 15 ? "720px" : "100%" }}
        >
          {frequencies.map((freq: number) => {
            const gain = graphicFilters[freq] ?? 0;
            const isZero = Math.abs(gain) < 0.1;

            return (
              <div
                key={freq}
                className="flex flex-col items-center justify-between flex-1 min-w-[28px] max-w-[44px] gap-2"
              >
                {/* Gain Display — Fixed Height */}
                <div className="h-4 flex items-center justify-center">
                  <span
                    className={`font-mono text-[10.5px] font-bold select-none ${
                      isZero
                        ? "text-tertiary"
                        : gain > 0
                        ? "text-[#0A84FF]"
                        : "text-amber-500"
                    }`}
                  >
                    {gain > 0 ? `+${gain.toFixed(0)}` : gain.toFixed(0)}
                  </span>
                </div>

                {/* Vertical Slider Track Container — Fixed 144px Height */}
                <div className="apple-inner-box relative h-36 w-6 flex items-center justify-center rounded-xl p-1 shadow-inner">
                  <div className="absolute w-full h-[1px] bg-[color:var(--panel-border-strong)] top-1/2 -translate-y-1/2 pointer-events-none" />

                  <input
                    type="range"
                    min="-15"
                    max="15"
                    step="0.5"
                    value={gain}
                    onChange={(e) =>
                      setGraphicFilter(freq, parseFloat(e.target.value) || 0)
                    }
                    className="h-32 w-1.5 appearance-none bg-transparent cursor-pointer [writing-mode:bt-lr] [-webkit-appearance:slider-vertical] accent-[#0A84FF]"
                  />
                </div>

                {/* Frequency Label — Fixed Height & Non-Breaking */}
                <div className="h-6 flex items-center justify-center">
                  <span className="font-mono text-[10px] text-tertiary select-none whitespace-nowrap font-medium">
                    {formatFreqPill(freq)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
