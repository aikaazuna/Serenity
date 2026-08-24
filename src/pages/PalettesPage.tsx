import React, { useMemo } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { motion } from 'framer-motion';
import { useAppStore } from '@/state/appStore';
import { generateAllPalettes } from '@/lib/color/palette';
import { PaletteCard } from '@/components/color/PaletteCard';
import { renderPaletteToPngDataUrl } from '@/lib/export/paletteExport';
import { savePngFile } from '@/lib/export/fileSave';
import { useClipboard } from '@/hooks/useClipboard';
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb } from '@/lib/color/convert';
import { Sparkles, Copy } from 'lucide-react';
import type { GeneratedPalette } from '@shared/types';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

export const PalettesPage: React.FC = () => {
  const t = useI18n();
  const activeColorHex = useAppStore((s) => s.activeColorHex);
  const setActiveColor = useAppStore((s) => s.setActiveColor);
  const notify = useAppStore((s) => s.notify);
  const { copy } = useClipboard();

  const palettes = useMemo(() => generateAllPalettes(activeColorHex), [activeColorHex]);

  // Generate 11-step Tailwind/Design System shades scale (50 to 950)
  const shadeScale = useMemo(() => {
    const rgb = hexToRgb(activeColorHex);
    const hsl = rgbToHsl(rgb);

    const steps = [
      { step: 50, l: 96 },
      { step: 100, l: 90 },
      { step: 200, l: 80 },
      { step: 300, l: 70 },
      { step: 400, l: 60 },
      { step: 500, l: 50 },
      { step: 600, l: 40 },
      { step: 700, l: 30 },
      { step: 800, l: 20 },
      { step: 900, l: 12 },
      { step: 950, l: 6 },
    ];

    return steps.map((s) => {
      const stepRgb = hslToRgb({ h: hsl.h, s: hsl.s, l: s.l });
      return {
        step: s.step,
        hex: rgbToHex(stepRgb),
      };
    });
  }, [activeColorHex]);

  const handleExportPng = async (palette: GeneratedPalette) => {
    try {
      const dataUrl = await renderPaletteToPngDataUrl(palette);
      const saved = await savePngFile(`serenity-palette-${palette.harmony}.png`, dataUrl);
      if (saved) notify('Palette exportée en image PNG', 'success');
    } catch {
      notify('Export PNG impossible', 'warning');
    }
  };

  const copyTailwindScale = () => {
    const scaleObj = shadeScale.reduce((acc, curr) => {
      acc[curr.step] = curr.hex;
      return acc;
    }, {} as Record<number, string>);

    const code = `'primary': ${JSON.stringify(scaleObj, null, 2)}`;
    void copy(code, 'tailwind-scale', 'Tailwind Scale');
  };

  return (
    <div className="flex flex-col gap-7 pb-12 select-none">
      {/* Header Info */}
      <div className="flex items-center gap-4">
        <div
          className="h-12 w-12 rounded-2xl border border-black/20 dark:border-white/20 shadow-xl"
          style={{ backgroundColor: activeColorHex }}
        />
        <div>
          <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">
            Palettes Harmonies & Nuancier de Teintes
          </h2>
          <p className="mono-tabular text-xs text-tertiary">
            {t.palettes.generatedFrom} {activeColorHex.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Full 50-950 Shade Scale Card */}
      <div className="apple-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0A84FF]" />
            <h3 className="text-xs font-bold text-[color:var(--text-primary)] uppercase tracking-wider">
              Échelle de Teintes 50 – 950 (Tailwind & Design System)
            </h3>
          </div>
          <button
            onClick={copyTailwindScale}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0A84FF] hover:bg-[#0071E3] rounded-xl shadow-sm transition"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copier Config Tailwind</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
          {shadeScale.map((item) => (
            <div
              key={item.step}
              onClick={() => {
                setActiveColor(item.hex, 'manual');
                notify(`Couleur ${item.hex.toUpperCase()} sélectionnée`, 'success');
              }}
              className="apple-inner-box group flex flex-col items-center gap-2 p-2 transition cursor-pointer hover:border-[color:var(--panel-border-strong)]"
            >
              <div
                className="w-full h-12 rounded-lg border border-black/10 dark:border-white/10 shadow-sm"
                style={{ backgroundColor: item.hex }}
              />
              <div className="text-center">
                <span className="text-[10px] font-bold text-tertiary block">{item.step}</span>
                <span className="text-[10.5px] font-mono text-[color:var(--text-primary)] font-semibold">
                  {item.hex.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chromatic Harmonies Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-[color:var(--text-primary)] uppercase tracking-wider px-1">
          Harmonies Chromatiques
        </h3>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        >
          {palettes.map((palette) => (
            <PaletteCard
              key={palette.harmony}
              palette={palette}
              onExportPng={handleExportPng}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
};
