import React, { useState, useRef } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { Upload, Sparkles } from 'lucide-react';
import { useAppStore } from '@/state/appStore';
import { useClipboard } from '@/hooks/useClipboard';
import { rgbToHex } from '@/lib/color/convert';

export const ImageExtractorPage: React.FC = () => {
  const t = useI18n();
  const setActiveColor = useAppStore((s) => s.setActiveColor);
  const notify = useAppStore((s) => s.notify);
  const { copy } = useClipboard();

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [hoverColor, setHoverColor] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setImageSrc(src);
      processImage(src);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setImageSrc(src);
      processImage(src);
    };
    reader.readAsDataURL(file);
  };

  const processImage = (src: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight).data;
      const step = Math.max(4, Math.floor((imgData.length / 4) / 2000));
      const colorCounts: Record<string, number> = {};

      for (let i = 0; i < imgData.length; i += step * 4) {
        const r = imgData[i] as number;
        const g = imgData[i + 1] as number;
        const b = imgData[i + 2] as number;
        const a = imgData[i + 3] as number;

        if (a < 128) continue;

        const qr = Math.round(r / 16) * 16;
        const qg = Math.round(g / 16) * 16;
        const qb = Math.round(b / 16) * 16;
        const hex = rgbToHex({ r: Math.min(255, qr), g: Math.min(255, qg), b: Math.min(255, qb) });

        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }

      const sorted = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([hex]) => hex)
        .slice(0, 10);

      setExtractedColors(sorted);
      if (sorted[0]) setActiveColor(sorted[0], 'manual');
      notify(`Palette extraite (${sorted.length} teintes dominantes)`, 'success');
    };
    img.src = src;
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const hex = rgbToHex({ r: pixel[0] as number, g: pixel[1] as number, b: pixel[2] as number });
      setHoverColor(hex);
      setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } catch {}
  };

  const handleCanvasClick = () => {
    if (hoverColor) {
      setActiveColor(hoverColor, 'manual');
      notify(`Couleur ${hoverColor.toUpperCase()} sélectionnée`, 'success');
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12 select-none">
      <div>
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">
          {t.imageExtract.title}
        </h2>
        <p className="text-xs text-secondary mt-1">
          {t.imageExtract.subtitle}
        </p>
      </div>

      {!imageSrc && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="apple-card flex flex-col items-center justify-center p-12 border-2 border-dashed border-[color:var(--panel-border-strong)] rounded-3xl hover:border-[#0A84FF]/50 transition-all cursor-pointer text-center space-y-4"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <div className="w-16 h-16 rounded-2xl bg-[#0A84FF]/15 text-[#0A84FF] flex items-center justify-center shadow-inner">
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[color:var(--text-primary)]">
              {t.imageExtract.dragDropTitle}
            </h3>
            <p className="text-xs text-tertiary mt-1">
              {t.imageExtract.dragDropSubtitle}
            </p>
          </div>
        </div>
      )}

      {imageSrc && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
          <div className="apple-card flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
              <span className="text-xs font-semibold text-[color:var(--text-primary)]">
                Image source & Loupe interactive
              </span>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="apple-inner-box px-3 py-1 text-xs font-medium text-secondary hover:text-[color:var(--text-primary)] transition"
              >
                Changer d'image
              </button>
            </div>

            <div className="relative w-full rounded-2xl overflow-hidden bg-black/40 border border-black/20 dark:border-white/10 flex items-center justify-center max-h-[420px]">
              <canvas
                ref={canvasRef}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={() => {
                  setHoverColor(null);
                  setHoverPos(null);
                }}
                onClick={handleCanvasClick}
                className="max-w-full max-h-[420px] object-contain cursor-crosshair block"
              />

              {hoverColor && hoverPos && (
                <div
                  className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-12 flex items-center gap-2 rounded-full border border-white/30 bg-black/85 px-3 py-1 shadow-2xl backdrop-blur-md mono-tabular text-xs text-white"
                  style={{ left: hoverPos.x, top: hoverPos.y }}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/50"
                    style={{ backgroundColor: hoverColor }}
                  />
                  <span>{hoverColor.toUpperCase()}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-tertiary">
              Survolez l'image pour prévisualiser les teintes et cliquez sur un pixel pour le définir comme couleur active.
            </p>
          </div>

          <div className="apple-card flex flex-col justify-between p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 border-b border-[color:var(--card-border)] pb-3">
                <Sparkles className="w-4 h-4 text-[#0A84FF]" />
                <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">
                  Palette Extraite ({extractedColors.length} teintes)
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                {extractedColors.map((hex) => (
                  <div
                    key={hex}
                    onClick={() => {
                      setActiveColor(hex, 'manual');
                      notify(`Couleur ${hex.toUpperCase()} sélectionnée`, 'success');
                    }}
                    className="apple-inner-box group flex items-center gap-3 p-2.5 transition cursor-pointer hover:border-[color:var(--panel-border-strong)]"
                  >
                    <div
                      className="w-10 h-10 rounded-xl border border-black/15 dark:border-white/20 shadow-sm shrink-0"
                      style={{ backgroundColor: hex }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-mono mono-tabular font-bold text-[color:var(--text-primary)] truncate">
                        {hex.toUpperCase()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void copy(hex, hex, 'HEX');
                        }}
                        className="text-[10.5px] text-tertiary group-hover:text-[#0A84FF] transition"
                      >
                        Copier →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                const paletteJson = JSON.stringify(extractedColors, null, 2);
                void copy(paletteJson, 'palette', 'JSON');
              }}
              className="w-full py-2.5 bg-[#0A84FF] hover:bg-[#0071E3] text-white font-semibold text-xs rounded-xl shadow-sm transition"
            >
              Copier toute la palette (JSON)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
