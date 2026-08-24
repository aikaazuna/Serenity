import { useCallback, useEffect, useRef, useState } from "react";
import type { DisplayCaptureSource } from "@shared/types";
import { Magnifier } from "./Magnifier";

interface CursorState {
  x: number;
  y: number;
  hex: string;
}

/**
 * Fenêtre plein écran (une par moniteur) affichant la capture de l'écran et permettant
 * d'échantillonner un pixel exact au clic. Toute la lecture de pixel se fait localement
 * dans le renderer (canvas), sans aller-retour IPC, pour rester fluide à 60 FPS.
 */
export function PickerOverlay() {
  const [source, setSource] = useState<DisplayCaptureSource | null>(null);
  const [magnifierZoom, setMagnifierZoom] = useState(8);
  const [cursor, setCursor] = useState<CursorState | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    void window.colorflow.picker
      .requestInit()
      .then((payload) => {
        if (!payload) return;
        setSource(payload.source);
        setMagnifierZoom(payload.magnifierZoom);
      })
      .catch((error: unknown) => {
        console.error("[picker] requestInit a échoué :", error);
      });
  }, []);

  useEffect(() => {
    if (!source) return;
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = source.imageWidth;
      canvas.height = source.imageHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx?.drawImage(img, 0, 0, source.imageWidth, source.imageHeight);
    };
    img.src = source.dataUrl;
  }, [source]);

  const sampleAt = useCallback(
    (clientX: number, clientY: number): CursorState | null => {
      const canvas = canvasRef.current;
      if (!canvas || !source) return null;
      const ratioX = source.imageWidth / source.bounds.width;
      const ratioY = source.imageHeight / source.bounds.height;
      const px = Math.min(source.imageWidth - 1, Math.max(0, Math.round(clientX * ratioX)));
      const py = Math.min(source.imageHeight - 1, Math.max(0, Math.round(clientY * ratioY)));
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      const data = ctx.getImageData(px, py, 1, 1).data;
      const hex = `#${[data[0] ?? 0, data[1] ?? 0, data[2] ?? 0]
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("")}`;
      return { x: clientX, y: clientY, hex };
    },
    [source],
  );

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const next = sampleAt(e.clientX, e.clientY);
        if (next) setCursor(next);
      });
    };

    const handleClick = (e: MouseEvent) => {
      const picked = sampleAt(e.clientX, e.clientY);
      if (!picked) return;
      setIsConfirming(true);
      setTimeout(() => window.colorflow.picker.confirm(picked.hex), 120);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") window.colorflow.picker.cancel();
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [sampleAt]);

  return (
    <div className="relative h-screen w-screen select-none overflow-hidden">
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{
          width: source ? source.bounds.width : "100%",
          height: source ? source.bounds.height : "100%",
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-black/10" />

      {cursor && source && (
        <>
          <div
            className="pointer-events-none absolute z-20 h-px w-full bg-white/25"
            style={{ top: cursor.y }}
          />
          <div
            className="pointer-events-none absolute z-20 h-full w-px bg-white/25"
            style={{ left: cursor.x }}
          />
          <Magnifier
            canvas={canvasRef.current}
            source={source}
            cursor={cursor}
            zoom={magnifierZoom}
            isConfirming={isConfirming}
          />
        </>
      )}

      {!source && (
        <div className="flex h-full w-full items-center justify-center bg-black/80 text-sm text-white/60">
          Préparation de la capture d'écran…
        </div>
      )}
    </div>
  );
}
