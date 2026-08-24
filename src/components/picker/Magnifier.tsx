import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { DisplayCaptureSource } from "@shared/types";

interface MagnifierProps {
  canvas: HTMLCanvasElement | null;
  source: DisplayCaptureSource;
  cursor: { x: number; y: number; hex: string };
  zoom: number;
  isConfirming: boolean;
}

const LOUPE_SIZE = 148;
const OFFSET = 28;

/** Convertit le réglage utilisateur (2 à 16) en nombre de pixels source affichés dans la loupe. */
function zoomToCropSize(zoom: number): number {
  return Math.max(4, Math.min(24, Math.round(88 / zoom)));
}

export function Magnifier({ canvas, source, cursor, zoom, isConfirming }: MagnifierProps) {
  const magnifierCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const target = magnifierCanvasRef.current;
    if (!target || !canvas) return;
    const ctx = target.getContext("2d");
    if (!ctx) return;

    const ratioX = source.imageWidth / source.bounds.width;
    const ratioY = source.imageHeight / source.bounds.height;
    const centerX = cursor.x * ratioX;
    const centerY = cursor.y * ratioY;

    const cropSize = zoomToCropSize(zoom);
    const sx = Math.round(centerX - cropSize / 2);
    const sy = Math.round(centerY - cropSize / 2);

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, LOUPE_SIZE, LOUPE_SIZE);
    ctx.drawImage(canvas, sx, sy, cropSize, cropSize, 0, 0, LOUPE_SIZE, LOUPE_SIZE);

    const cell = LOUPE_SIZE / cropSize;
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    for (let i = 1; i < cropSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, LOUPE_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cell);
      ctx.lineTo(LOUPE_SIZE, i * cell);
      ctx.stroke();
    }

    const centerCell = Math.floor(cropSize / 2);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(centerCell * cell, centerCell * cell, cell, cell);
  }, [canvas, source, cursor, zoom]);

  const screenWidth = source.bounds.width;
  const screenHeight = source.bounds.height;
  const flipX = cursor.x > screenWidth - LOUPE_SIZE - OFFSET - 40;
  const flipY = cursor.y > screenHeight - LOUPE_SIZE - OFFSET - 60;

  const left = flipX ? cursor.x - LOUPE_SIZE - OFFSET : cursor.x + OFFSET;
  const top = flipY ? cursor.y - LOUPE_SIZE - OFFSET - 46 : cursor.y + OFFSET;

  return (
    <motion.div
      className="pointer-events-none absolute z-30 flex flex-col items-center gap-1.5"
      style={{ left, top }}
      animate={isConfirming ? { scale: 1.08 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 24 }}
    >
      <div
        className="overflow-hidden rounded-2xl border-2 border-white/80 shadow-glass-lg"
        style={{ width: LOUPE_SIZE, height: LOUPE_SIZE }}
      >
        <canvas ref={magnifierCanvasRef} width={LOUPE_SIZE} height={LOUPE_SIZE} />
      </div>
      <div className="flex items-center gap-1.5 rounded-full bg-black/75 px-2.5 py-1 shadow-glass">
        <span className="h-3 w-3 rounded-full border border-white/50" style={{ backgroundColor: cursor.hex }} />
        <span className="mono-tabular text-[11px] font-semibold text-white">{cursor.hex.toUpperCase()}</span>
      </div>
    </motion.div>
  );
}
