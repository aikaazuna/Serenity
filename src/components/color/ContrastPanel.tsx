import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import type { ColorSnapshot } from "@shared/types";
import { GlassCard } from "@/components/ui/GlassCard";
import { analyzeContrast } from "@/lib/color/contrast";
import { cn } from "@/lib/utils";

function CriterionRow({ label, pass, ratio }: { label: string; pass: boolean; ratio?: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[color:var(--panel-border)] bg-white/[0.02] px-3 py-2">
      <span className="text-[12px] text-secondary">{label}</span>
      <div className="flex items-center gap-1.5">
        {ratio && <span className="mono-tabular text-[11px] text-tertiary">{ratio}</span>}
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full",
            pass ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/15 text-red-300",
          )}
        >
          {pass ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        </span>
      </div>
    </div>
  );
}

export function ContrastPanel({ color }: { color: ColorSnapshot }) {
  const result = analyzeContrast(color.rgb);

  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-[color:var(--text-primary)]">Contraste WCAG</h3>
        <motion.span
          key={result.ratio}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mono-tabular rounded-full border border-[color:var(--panel-border)] bg-[color:var(--panel-bg)] px-2.5 py-0.5 text-[12px] font-semibold text-[color:var(--text-primary)]"
        >
          {result.ratio}:1
        </motion.span>
      </div>

      <div className="mb-3 flex gap-2">
        {(["#000000", "#ffffff"] as const).map((textColor) => {
          const recommended = result.recommendedTextColor === textColor;
          return (
            <div
              key={textColor}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl border p-3 transition",
                recommended ? "border-white/30" : "border-[color:var(--panel-border)]",
              )}
              style={{ backgroundColor: color.hex }}
            >
              <span
                className="text-sm font-semibold"
                style={{ color: textColor }}
              >
                Aa
              </span>
              <span className="text-[10px] font-medium uppercase" style={{ color: textColor }}>
                {textColor === "#000000" ? "Texte noir" : "Texte blanc"}
                {recommended && " ✓"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <CriterionRow label="AA normal (4.5:1)" pass={result.aaNormal} />
        <CriterionRow label="AA large (3:1)" pass={result.aaLarge} />
        <CriterionRow label="AAA normal (7:1)" pass={result.aaaNormal} />
        <CriterionRow label="AAA large (4.5:1)" pass={result.aaaLarge} />
      </div>
    </GlassCard>
  );
}
