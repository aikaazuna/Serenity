import React, { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { useAppStore } from '@/state/appStore';
import { useClipboard } from '@/hooks/useClipboard';
import { Sparkles, Copy, Plus, Trash2, Code } from 'lucide-react';

interface GradientStop {
  id: string;
  color: string;
  position: number; // 0-100
}

interface PrebuiltGradient {
  name: string;
  type: 'linear' | 'radial' | 'conic';
  angle: number;
  stops: { color: string; position: number }[];
}

const PREBUILT_GRADIENTS: PrebuiltGradient[] = [
  {
    name: 'Apple Cupertino Glow',
    type: 'linear',
    angle: 135,
    stops: [
      { color: '#0A84FF', position: 0 },
      { color: '#5E5CE6', position: 50 },
      { color: '#BF5AF2', position: 100 },
    ],
  },
  {
    name: 'Sunset Mojave',
    type: 'linear',
    angle: 90,
    stops: [
      { color: '#FF375F', position: 0 },
      { color: '#FF9F0A', position: 50 },
      { color: '#FFD60A', position: 100 },
    ],
  },
  {
    name: 'Aurora Borealis',
    type: 'linear',
    angle: 120,
    stops: [
      { color: '#30D158', position: 0 },
      { color: '#64D2FF', position: 50 },
      { color: '#0A84FF', position: 100 },
    ],
  },
  {
    name: 'Cyberpunk Neon',
    type: 'linear',
    angle: 45,
    stops: [
      { color: '#FF2D55', position: 0 },
      { color: '#7928CA', position: 50 },
      { color: '#00DFD8', position: 100 },
    ],
  },
  {
    name: 'Midnight Velvet',
    type: 'radial',
    angle: 0,
    stops: [
      { color: '#5E5CE6', position: 0 },
      { color: '#1C1C1E', position: 70 },
      { color: '#000000', position: 100 },
    ],
  },
  {
    name: 'Emerald Lagoon',
    type: 'linear',
    angle: 180,
    stops: [
      { color: '#30D158', position: 0 },
      { color: '#007A5E', position: 100 },
    ],
  },
];

export const GradientStudioPage: React.FC = () => {
  const t = useI18n();
  const activeColorHex = useAppStore((s) => s.activeColorHex);
  const notify = useAppStore((s) => s.notify);
  const { copy } = useClipboard();

  const [gradientType, setGradientType] = useState<'linear' | 'radial' | 'conic'>('linear');
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<GradientStop[]>([
    { id: '1', color: activeColorHex, position: 0 },
    { id: '2', color: '#BF5AF2', position: 100 },
  ]);

  const generateCssGradient = () => {
    const stopsStr = stops
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((s) => `${s.color} ${s.position}%`)
      .join(', ');

    if (gradientType === 'linear') {
      return `linear-gradient(${angle}deg, ${stopsStr})`;
    } else if (gradientType === 'radial') {
      return `radial-gradient(circle at center, ${stopsStr})`;
    } else {
      return `conic-gradient(from ${angle}deg at 50% 50%, ${stopsStr})`;
    }
  };

  const cssString = `background: ${generateCssGradient()};`;

  const generateSwiftUIString = () => {
    const stopsSwift = stops
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((s) => `Gradient.Stop(color: Color(hex: "${s.color}"), location: ${s.position / 100})`)
      .join(',\n    ');

    return `LinearGradient(\n  gradient: Gradient(stops: [\n    ${stopsSwift}\n  ]),\n  startPoint: .topLeading,\n  endPoint: .bottomTrailing\n)`;
  };

  const handleAddStop = () => {
    if (stops.length >= 6) return;
    const newStop: GradientStop = {
      id: String(Date.now()),
      color: '#FFFFFF',
      position: 50,
    };
    setStops([...stops, newStop]);
  };

  const handleRemoveStop = (id: string) => {
    if (stops.length <= 2) return;
    setStops(stops.filter((s) => s.id !== id));
  };

  const handleUpdateStop = (id: string, updates: Partial<GradientStop>) => {
    setStops(stops.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const applyPrebuilt = (prebuilt: PrebuiltGradient) => {
    setGradientType(prebuilt.type);
    setAngle(prebuilt.angle);
    setStops(
      prebuilt.stops.map((s, idx) => ({
        id: String(idx),
        color: s.color,
        position: s.position,
      }))
    );
    notify(`Dégradé « ${prebuilt.name} » appliqué`, 'success');
  };

  return (
    <div className="flex flex-col gap-6 pb-12 select-none">
      <div>
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">
          {t.gradients.title}
        </h2>
        <p className="text-xs text-secondary mt-1">
          {t.gradients.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        <div className="apple-card flex flex-col gap-5 p-6">
          <div
            className="w-full h-56 rounded-2xl border border-black/10 dark:border-white/20 shadow-xl transition-all duration-300 relative overflow-hidden flex items-end p-4"
            style={{ background: generateCssGradient() }}
          >
            <div className="rounded-xl bg-black/75 backdrop-blur-md px-3 py-1.5 border border-white/10 text-xs font-mono text-white shadow-lg">
              {cssString}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--card-border)] pb-4">
            <div className="apple-inner-box flex p-1 rounded-xl gap-1">
              {(['linear', 'radial', 'conic'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setGradientType(t)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition ${
                    gradientType === t
                      ? 'bg-[#0A84FF] text-white shadow-sm'
                      : 'text-secondary hover:text-[color:var(--text-primary)]'
                  }`}
                >
                  {t === 'linear' ? 'Linéaire' : t === 'radial' ? 'Radial' : 'Conique'}
                </button>
              ))}
            </div>

            {gradientType !== 'radial' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-secondary">Angle :</span>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={angle}
                  onChange={(e) => setAngle(parseInt(e.target.value))}
                  className="w-24 h-1.5 bg-black/20 dark:bg-black/40 rounded-full appearance-none accent-[#0A84FF] cursor-pointer"
                />
                <span className="text-xs font-mono text-tertiary w-8">{angle}°</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[color:var(--text-primary)]">
                {t.gradients.colorStops} ({stops.length}/6)
              </span>
              <button
                onClick={handleAddStop}
                disabled={stops.length >= 6}
                className="apple-inner-box flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[color:var(--text-primary)] transition disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un point</span>
              </button>
            </div>

            <div className="space-y-2">
              {stops.map((stop) => (
                <div
                  key={stop.id}
                  className="apple-inner-box flex items-center gap-3 p-2.5"
                >
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => handleUpdateStop(stop.id, { color: e.target.value })}
                    className="w-8 h-8 rounded-lg border-0 bg-transparent cursor-pointer"
                  />

                  <input
                    type="text"
                    value={stop.color.toUpperCase()}
                    onChange={(e) => handleUpdateStop(stop.id, { color: e.target.value })}
                    className="apple-inner-box w-24 px-2 py-1 text-xs font-mono font-bold text-[color:var(--text-primary)] rounded-lg"
                  />

                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stop.position}
                      onChange={(e) =>
                        handleUpdateStop(stop.id, { position: parseInt(e.target.value) })
                      }
                      className="w-full h-1.5 bg-black/20 dark:bg-black/40 rounded-full appearance-none accent-[#0A84FF] cursor-pointer"
                    />
                    <span className="text-xs font-mono text-tertiary w-9 text-right">
                      {stop.position}%
                    </span>
                  </div>

                  {stops.length > 2 && (
                    <button
                      onClick={() => handleRemoveStop(stop.id)}
                      className="p-1 text-tertiary hover:text-red-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="apple-card p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-[color:var(--card-border)] pb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-[color:var(--text-primary)] uppercase tracking-wider">
                {t.gradients.recommended}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {PREBUILT_GRADIENTS.map((p) => {
                const stopsStr = p.stops.map((s) => `${s.color} ${s.position}%`).join(', ');
                const bg = `linear-gradient(${p.angle}deg, ${stopsStr})`;

                return (
                  <div
                    key={p.name}
                    onClick={() => applyPrebuilt(p)}
                    className="apple-inner-box group p-3 transition cursor-pointer space-y-2 hover:border-[color:var(--panel-border-strong)]"
                  >
                    <div className="w-full h-12 rounded-lg border border-black/10 dark:border-white/10 shadow-sm" style={{ background: bg }} />
                    <span className="text-xs font-bold text-[color:var(--text-primary)] truncate block">
                      {p.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="apple-card p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-2">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-[#0A84FF]" />
                <h3 className="text-xs font-bold text-[color:var(--text-primary)] uppercase tracking-wider">
                  Snippets de Code
                </h3>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => void copy(cssString, 'css-grad', 'CSS')}
                className="apple-inner-box w-full flex items-center justify-between p-3 text-xs text-secondary font-mono hover:text-[color:var(--text-primary)] transition"
              >
                <span className="truncate">{cssString}</span>
                <Copy className="w-3.5 h-3.5 text-tertiary ml-2 shrink-0" />
              </button>

              <button
                onClick={() => void copy(generateSwiftUIString(), 'swift-grad', 'SwiftUI')}
                className="apple-inner-box w-full flex items-center justify-between p-3 text-xs text-secondary font-mono hover:text-[color:var(--text-primary)] transition"
              >
                <span>Copier code SwiftUI (LinearGradient)</span>
                <Copy className="w-3.5 h-3.5 text-tertiary ml-2 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
