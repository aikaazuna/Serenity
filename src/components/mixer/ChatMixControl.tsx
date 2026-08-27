import React from "react";
import { useMixerStore } from "@/state/mixerStore";
import { Gamepad2, Mic2, RotateCcw } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";

export const ChatMixControl: React.FC = () => {
  const t = useI18n();
  const chatMix = useMixerStore((s) => s.chatMix);
  const setChatMix = useMixerStore((s) => s.setChatMix);

  // Convert -100..100 to percentages
  // -100 => 100% Game, 0% Chat
  // 0 => 100% Game, 100% Chat
  // +100 => 0% Game, 100% Chat
  const gamePct = chatMix > 0 ? Math.round(100 - chatMix) : 100;
  const chatPct = chatMix < 0 ? Math.round(100 + chatMix) : 100;

  return (
    <div className="apple-inner-box p-3 sm:p-4 rounded-2xl border border-[color:var(--card-border-inner)] bg-[color:var(--card-bg)] space-y-2 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--text-primary)]">
            {t.mixer.chatMixTitle}
          </span>
          <span className="text-[10px] text-tertiary">
            (Équilibre audio Jeu / Discussion)
          </span>
        </div>

        {chatMix !== 0 && (
          <button
            type="button"
            onClick={() => setChatMix(0)}
            className="flex items-center gap-1 text-[10px] font-medium text-secondary hover:text-[color:var(--text-primary)] transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Réinitialiser</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Game Icon & Percent */}
        <div className="flex items-center gap-1.5 min-w-[75px]">
          <Gamepad2 className="w-4 h-4 text-[#30D158]" />
          <span className="text-xs font-bold text-[#30D158] font-mono">{gamePct}%</span>
        </div>

        {/* Range Slider Track */}
        <div className="relative flex-1 flex items-center">
          {/* Center Zero Notch Dot */}
          <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-3 bg-neutral-500/50 rounded-full pointer-events-none z-10" />

          <input
            type="range"
            min="-100"
            max="100"
            step="1"
            value={chatMix}
            onChange={(e) => setChatMix(Number(e.target.value))}
            className="w-full h-2 rounded-full bg-black/40 accent-[#0A84FF] cursor-pointer appearance-none border border-[color:var(--card-border-inner)]"
          />
        </div>

        {/* Chat Icon & Percent */}
        <div className="flex items-center gap-1.5 justify-end min-w-[75px]">
          <span className="text-xs font-bold text-[#00A6FB] font-mono">{chatPct}%</span>
          <Mic2 className="w-4 h-4 text-[#00A6FB]" />
        </div>
      </div>
    </div>
  );
};
