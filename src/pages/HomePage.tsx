import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/state/appStore';
import { useColorSnapshot } from '@/hooks/useColorSnapshot';
import { ColorHero } from '@/components/color/ColorHero';
import { ColorFormatsList } from '@/components/color/ColorFormatsList';
import { DevFormatsList } from '@/components/color/DevFormatsList';
import { ContrastPanel } from '@/components/color/ContrastPanel';
import { hsvToRgb, rgbToHex } from '@/lib/color/convert';

export const HomePage: React.FC = () => {
  const activeColorHex = useAppStore((s) => s.activeColorHex);
  const setActiveColor = useAppStore((s) => s.setActiveColor);
  const color = useColorSnapshot(activeColorHex);

  const [hsv, setHsv] = useState({ h: 0, s: 100, v: 100 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);

  useEffect(() => {
    if (color) {
      setHsv(color.hsv);
    }
  }, [color?.hex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const baseRgb = hsvToRgb({ h: hsv.h, s: 100, v: 100 });
    const baseColor = `rgb(${baseRgb.r}, ${baseRgb.g}, ${baseRgb.b})`;

    const gradWhite = ctx.createLinearGradient(0, 0, width, 0);
    gradWhite.addColorStop(0, '#ffffff');
    gradWhite.addColorStop(1, baseColor);
    ctx.fillStyle = gradWhite;
    ctx.fillRect(0, 0, width, height);

    const gradBlack = ctx.createLinearGradient(0, 0, 0, height);
    gradBlack.addColorStop(0, 'rgba(0,0,0,0)');
    gradBlack.addColorStop(1, '#000000');
    ctx.fillStyle = gradBlack;
    ctx.fillRect(0, 0, width, height);

    const handleX = (hsv.s / 100) * width;
    const handleY = (1 - hsv.v / 100) * height;

    ctx.beginPath();
    ctx.arc(handleX, handleY, 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(handleX, handleY, 6, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [hsv.h, hsv.s, hsv.v]);

  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    const s = Math.round((x / rect.width) * 100);
    const v = Math.round((1 - y / rect.height) * 100);

    const newHsv = { ...hsv, s, v };
    setHsv(newHsv);

    const rgb = hsvToRgb(newHsv);
    const hex = rgbToHex(rgb);
    setActiveColor(hex, 'manual');
  };

  const handleHueChange = (newHue: number) => {
    const newHsv = { ...hsv, h: newHue };
    setHsv(newHsv);
    const rgb = hsvToRgb(newHsv);
    const hex = rgbToHex(rgb);
    setActiveColor(hex, 'manual');
  };

  if (!color) return null;

  return (
    <div className="flex flex-col gap-6 pb-12 select-none">
      <ColorHero color={color} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        <div className="apple-card flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
            <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">
              Sélecteur de Nuance & Teinte 2D
            </h3>
            <span className="text-[11px] text-tertiary font-mono">
              HSV ({Math.round(hsv.h)}°, {Math.round(hsv.s)}%, {Math.round(hsv.v)}%)
            </span>
          </div>

          <div className="relative w-full h-[220px] rounded-2xl overflow-hidden border border-black/20 dark:border-white/10 shadow-inner">
            <canvas
              ref={canvasRef}
              width={480}
              height={220}
              onMouseDown={(e) => {
                setIsDraggingCanvas(true);
                handleCanvasInteraction(e);
              }}
              onMouseMove={(e) => {
                if (isDraggingCanvas) handleCanvasInteraction(e);
              }}
              onMouseUp={() => setIsDraggingCanvas(false)}
              onMouseLeave={() => setIsDraggingCanvas(false)}
              className="w-full h-full block cursor-crosshair"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-secondary">Teinte (Hue)</span>
              <span className="font-mono text-tertiary">{Math.round(hsv.h)}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={hsv.h}
              onChange={(e) => handleHueChange(parseFloat(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer"
              style={{
                background:
                  'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
            <div className="apple-inner-box p-2.5">
              <span className="text-[10px] text-tertiary block font-mono">ROUGE</span>
              <span className="font-mono font-bold text-[color:var(--text-primary)]">
                {color.rgb.r}
              </span>
            </div>
            <div className="apple-inner-box p-2.5">
              <span className="text-[10px] text-tertiary block font-mono">VERT</span>
              <span className="font-mono font-bold text-[color:var(--text-primary)]">
                {color.rgb.g}
              </span>
            </div>
            <div className="apple-inner-box p-2.5">
              <span className="text-[10px] text-tertiary block font-mono">BLEU</span>
              <span className="font-mono font-bold text-[color:var(--text-primary)]">
                {color.rgb.b}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <ColorFormatsList color={color} />
          <ContrastPanel color={color} />
        </div>
      </div>

      <DevFormatsList color={color} />
    </div>
  );
};
