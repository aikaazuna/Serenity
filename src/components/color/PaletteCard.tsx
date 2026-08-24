import { useState } from "react";
import { useI18n } from '@/hooks/useI18n';
import { motion } from "framer-motion";
import { Check, Copy, Download, Heart } from "lucide-react";
import type { GeneratedPalette } from "@shared/types";
import { HARMONY_LABELS } from "@/lib/color/palette";
import { useClipboard } from "@/hooks/useClipboard";
import { useAppStore } from "@/state/appStore";
import { Tooltip } from "@/components/ui/Tooltip";
import { exportPaletteAsJson, exportPaletteAsCssVars, exportPaletteAsScss, exportPaletteAsTailwind } from "@/lib/export/paletteExport";

interface PaletteCardProps {
  palette: GeneratedPalette;
  onExportPng: (palette: GeneratedPalette) => void;
}

export function PaletteCard({ palette, onExportPng }: PaletteCardProps) {
  const t = useI18n();
  const { copy, copiedKey } = useClipboard();
  const addFavorite = useAppStore((s) => s.addFavorite);
  const notify = useAppStore((s) => s.notify);
  const [exportOpen, setExportOpen] = useState(false);

  const handleExport = (format: "json" | "css" | "scss" | "tailwind" | "png") => {
    setExportOpen(false);
    if (format === "png") return onExportPng(palette);
    const content =
      format === "json"
        ? exportPaletteAsJson(palette)
        : format === "css"
          ? exportPaletteAsCssVars(palette)
          : format === "scss"
            ? exportPaletteAsScss(palette)
            : exportPaletteAsTailwind(palette);
    void copy(content, `export-${palette.id}`, "Palette exportée");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="glass-panel rounded-2xl p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-[13px] font-semibold text-[color:var(--text-primary)]">{HARMONY_LABELS[palette.harmony]}</h4>
        <div className="relative flex items-center gap-1">
          <Tooltip content="Exporter">
            <button
              onClick={() => setExportOpen((v) => !v)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-secondary transition hover:bg-[color:var(--panel-bg-strong)] hover:text-[color:var(--text-primary)]"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
          {exportOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-8 z-20 w-36 overflow-hidden rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--card-bg)] p-1 shadow-2xl backdrop-blur-xl"
            >
              {[
                { id: "json", label: "JSON" },
                { id: "css", label: "CSS Variables" },
                { id: "tailwind", label: "Tailwind" },
                { id: "scss", label: "SCSS" },
                { id: "png", label: "Image PNG" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleExport(opt.id as "json" | "css" | "scss" | "tailwind" | "png")}
                  className="flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-[12px] text-[color:var(--text-primary)] hover:bg-[color:var(--panel-bg-strong)]"
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <div className="flex overflow-hidden rounded-xl border border-[color:var(--panel-border)]">
        {palette.colors.map((hex, index) => {
          const key = `${palette.id}-${index}`;
          const isCopied = copiedKey === key;
          return (
            <Tooltip key={key} content={hex.toUpperCase()}>
              <button
                onClick={() => copy(hex, key, hex.toUpperCase())}
                onDoubleClick={() => {
                  addFavorite(hex);
                  notify(t.colorHero.addedToFav, "success", hex.toUpperCase());
                }}
                style={{ backgroundColor: hex }}
                className="group relative h-14 flex-1 transition-[flex-grow] duration-200 hover:flex-[1.6] focus-ring"
              >
                <span className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {isCopied ? (
                    <Check className="h-3.5 w-3.5 text-white drop-shadow" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-[color:var(--text-primary)] drop-shadow" />
                  )}
                </span>
                <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center opacity-0 transition-opacity group-hover:opacity-100">
                  <Heart className="h-2.5 w-2.5 text-white/70" />
                </span>
              </button>
            </Tooltip>
          );
        })}
      </div>
    </motion.div>
  );
}
