import React, { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useAppStore } from '@/state/appStore';
import { useColorSnapshot } from '@/hooks/useColorSnapshot';
import { analyzeContrast } from '@/lib/color/contrast';
import { hexToRgb, rgbToHex } from '@/lib/color/convert';
import { Eye, Check, X } from 'lucide-react';

type DeficiencyType =
  | 'normal'
  | 'protanopia'
  | 'protanomaly'
  | 'deuteranopia'
  | 'deuteranomaly'
  | 'tritanopia'
  | 'tritanomaly'
  | 'achromatopsia';

const DEFICIENCIES: { id: DeficiencyType; name: string; desc: string; prevalence: string }[] = [
  { id: 'normal', name: '{t.accessibility.visionStandard}', desc: 'Perception normale de toutes les longueurs d’onde.', prevalence: '92%' },
  { id: 'deuteranomaly', name: '{t.accessibility.deuteranomaly}', desc: '{t.accessibility.deuteranomalyDesc}', prevalence: '5% ♂' },
  { id: 'deuteranopia', name: '{t.accessibility.deuteranopia}', desc: '{t.accessibility.deuteranopiaDesc}', prevalence: '1% ♂' },
  { id: 'protanomaly', name: '{t.accessibility.protanomaly}', desc: '{t.accessibility.protanomalyDesc}', prevalence: '1% ♂' },
  { id: 'protanopia', name: 'Protanopie', desc: 'Absence totale de cônes rouges.', prevalence: '1% ♂' },
  { id: 'tritanomaly', name: 'Tritanomalie', desc: 'Sensibilité réduite au bleu/jaune.', prevalence: '< 0.1%' },
  { id: 'tritanopia', name: 'Tritanopie', desc: 'Absence totale de cônes bleus.', prevalence: '< 0.1%' },
  { id: 'achromatopsia', name: 'Achromatopsie', desc: 'Absence totale de vision des couleurs (monochrome).', prevalence: '0.003%' },
];

function simulateColorDeficiency(hex: string, type: DeficiencyType): string {
  if (type === 'normal') return hex;
  const { r, g, b } = hexToRgb(hex);

  let sr = r, sg = g, sb = b;

  if (type === 'protanopia') {
    sr = 0.56667 * r + 0.43333 * g;
    sg = 0.55833 * r + 0.44167 * g;
    sb = 0.24167 * g + 0.75833 * b;
  } else if (type === 'deuteranopia') {
    sr = 0.625 * r + 0.375 * g;
    sg = 0.7 * r + 0.3 * g;
    sb = 0.3 * g + 0.7 * b;
  } else if (type === 'tritanopia') {
    sr = 0.95 * r + 0.05 * g;
    sg = 0.43333 * g + 0.56667 * b;
    sb = 0.475 * g + 0.525 * b;
  } else if (type === 'achromatopsia') {
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    sr = gray; sg = gray; sb = gray;
  } else if (type === 'deuteranomaly') {
    sr = 0.8 * r + 0.2 * g;
    sg = 0.25833 * r + 0.74167 * g;
    sb = 0.14167 * g + 0.85833 * b;
  } else if (type === 'protanomaly') {
    sr = 0.81667 * r + 0.18333 * g;
    sg = 0.33333 * r + 0.66667 * g;
    sb = 0.125 * g + 0.875 * b;
  } else if (type === 'tritanomaly') {
    sr = 0.96667 * r + 0.03333 * g;
    sg = 0.73333 * g + 0.26667 * b;
    sb = 0.18333 * g + 0.81667 * b;
  }

  return rgbToHex({
    r: Math.max(0, Math.min(255, Math.round(sr))),
    g: Math.max(0, Math.min(255, Math.round(sg))),
    b: Math.max(0, Math.min(255, Math.round(sb))),
  });
}

export const AccessibilityPage: React.FC = () => {
  const t = useI18n();
  const activeColorHex = useAppStore((s) => s.activeColorHex);
  const color = useColorSnapshot(activeColorHex);
  const [selectedDeficiency, setSelectedDeficiency] = useState<DeficiencyType>('normal');

  if (!color) return null;

  const contrast = analyzeContrast(color.rgb);
  const simulatedColor = simulateColorDeficiency(activeColorHex, selectedDeficiency);

  return (
    <div className="flex flex-col gap-6 pb-12 select-none">
      <div>
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">
          {t.accessibility.title}
        </h2>
        <p className="text-xs text-secondary mt-1">
          {t.accessibility.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="apple-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
            <h3 className="text-xs font-bold text-[color:var(--text-primary)] uppercase tracking-wider">
              Ratio de Contraste WCAG 2.1
            </h3>
            <span className="apple-inner-box text-sm font-mono font-bold text-[color:var(--text-primary)] px-2.5 py-0.5 rounded-lg">
              {contrast.ratio}:1
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="apple-inner-box flex items-center justify-between p-2.5">
              <span className="text-secondary font-medium">{t.accessibility.normalTextAA} (min 4.5:1)</span>
              <span className={`flex items-center gap-1 font-bold ${contrast.aaNormal ? 'text-emerald-500' : 'text-red-500'}`}>
                {contrast.aaNormal ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {contrast.aaNormal ? '{t.accessibility.pass}' : '{t.accessibility.fail}'}
              </span>
            </div>

            <div className="apple-inner-box flex items-center justify-between p-2.5">
              <span className="text-secondary font-medium">{t.accessibility.largeTextAA} (min 3.0:1)</span>
              <span className={`flex items-center gap-1 font-bold ${contrast.aaLarge ? 'text-emerald-500' : 'text-red-500'}`}>
                {contrast.aaLarge ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {contrast.aaLarge ? '{t.accessibility.pass}' : '{t.accessibility.fail}'}
              </span>
            </div>

            <div className="apple-inner-box flex items-center justify-between p-2.5">
              <span className="text-secondary font-medium">{t.accessibility.normalTextAA}A (min 7.0:1)</span>
              <span className={`flex items-center gap-1 font-bold ${contrast.aaaNormal ? 'text-emerald-500' : 'text-red-500'}`}>
                {contrast.aaaNormal ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {contrast.aaaNormal ? '{t.accessibility.pass}' : '{t.accessibility.fail}'}
              </span>
            </div>

            <div className="apple-inner-box flex items-center justify-between p-2.5">
              <span className="text-secondary font-medium">{t.accessibility.largeTextAA}A (min 4.5:1)</span>
              <span className={`flex items-center gap-1 font-bold ${contrast.aaaLarge ? 'text-emerald-500' : 'text-red-500'}`}>
                {contrast.aaaLarge ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                {contrast.aaaLarge ? '{t.accessibility.pass}' : '{t.accessibility.fail}'}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 apple-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
            <h3 className="text-xs font-bold text-[color:var(--text-primary)] uppercase tracking-wider">
              Aperçu Composants UI avec Simulation
            </h3>
            <span className="text-xs font-mono font-bold text-[#0A84FF]">
              {simulatedColor.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="apple-inner-box p-4 space-y-3">
              <span className="text-[11px] font-medium text-tertiary">{t.accessibility.ctaButton}</span>
              <button
                className="w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition"
                style={{
                  backgroundColor: simulatedColor,
                  color: contrast.recommendedTextColor,
                }}
              >
                {t.accessibility.confirmAction}
              </button>
            </div>

            <div className="apple-inner-box p-4 space-y-3">
              <span className="text-[11px] font-medium text-tertiary">{t.accessibility.toast}</span>
              <div
                className="p-3 rounded-xl border flex items-center gap-2 text-xs font-medium"
                style={{
                  backgroundColor: `${simulatedColor}20`,
                  borderColor: `${simulatedColor}50`,
                  color: simulatedColor,
                }}
              >
                <Eye className="w-4 h-4 shrink-0" />
                <span className="truncate">{t.accessibility.syncStatus}</span>
              </div>
            </div>
          </div>

          <div
            className="p-4 rounded-xl border transition-colors shadow-sm"
            style={{ backgroundColor: simulatedColor }}
          >
            <p
              className="text-sm font-bold leading-relaxed"
              style={{ color: contrast.recommendedTextColor }}
            >
              {t.accessibility.quickFox}
            </p>
            <p
              className="text-xs mt-1 opacity-80"
              style={{ color: contrast.recommendedTextColor }}
            >
              {t.accessibility.secondaryText}
            </p>
          </div>
        </div>
      </div>

      <div className="apple-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
          <h3 className="text-xs font-bold text-[color:var(--text-primary)] uppercase tracking-wider">
            Simulateur de Déficiences Visuelles (Daltonisme)
          </h3>
          <span className="text-xs text-tertiary">{t.accessibility.selectAnomaly}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {DEFICIENCIES.map((def) => {
            const previewHex = simulateColorDeficiency(activeColorHex, def.id);
            const isSelected = selectedDeficiency === def.id;

            return (
              <div
                key={def.id}
                onClick={() => setSelectedDeficiency(def.id)}
                className={`apple-inner-box group p-3.5 transition cursor-pointer select-none space-y-2.5 ${
                  isSelected ? 'border-[#0A84FF] ring-1 ring-[#0A84FF]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-7 h-7 rounded-lg border border-black/20 dark:border-white/20 shadow-sm"
                    style={{ backgroundColor: previewHex }}
                  />
                  <span className="text-[10px] text-tertiary font-mono">{def.prevalence}</span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[color:var(--text-primary)] group-hover:text-[#0A84FF] transition">
                    {def.name}
                  </h4>
                  <p className="text-[11px] text-secondary mt-0.5 line-clamp-2">
                    {def.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
