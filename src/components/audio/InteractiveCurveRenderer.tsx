import React, { useRef, useEffect, useState, useCallback } from "react";
import { useAudioStore } from "@/state/audioStore";
import { EQEngine } from "@/lib/eq-engine";
import { Activity } from "lucide-react";

const NODE_COLORS = [
  "#0A84FF",
  "#30D158",
  "#FF9F0A",
  "#BF5AF2",
  "#FF375F",
  "#64D2FF",
  "#FFD60A",
  "#5E5CE6",
];

const PAD_X = 38;
const PAD_Y = 26;

export const InteractiveCurveRenderer: React.FC = () => {
  const audioState = useAudioStore();
  const updateParametricFilter = useAudioStore((s) => s.updateParametricFilter);
  const addParametricFilter = useAudioStore((s) => s.addParametricFilter);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [draggedNode, setDraggedNode] = useState<number | null>(null);

  const freqToX = useCallback((freq: number, width: number) => {
    const usableW = Math.max(10, width - PAD_X * 2);
    const minF = Math.log10(20);
    const maxF = Math.log10(20000);
    const curF = Math.log10(Math.max(20, Math.min(20000, freq || 20)));
    return PAD_X + ((curF - minF) / (maxF - minF)) * usableW;
  }, []);

  const xToFreq = useCallback((x: number, width: number) => {
    const usableW = Math.max(10, width - PAD_X * 2);
    const minF = Math.log10(20);
    const maxF = Math.log10(20000);
    const clampedX = Math.max(0, Math.min(usableW, x - PAD_X));
    const curF = minF + (clampedX / usableW) * (maxF - minF);
    return Math.pow(10, curF);
  }, []);

  const gainToY = useCallback((gain: number, height: number) => {
    const usableH = Math.max(10, height - PAD_Y * 2);
    const minGain = -20;
    const maxGain = 20;
    const clamped = Math.max(minGain, Math.min(maxGain, isNaN(gain) ? 0 : gain));
    return PAD_Y + usableH - ((clamped - minGain) / (maxGain - minGain)) * usableH;
  }, []);

  const yToGain = useCallback((y: number, height: number) => {
    const usableH = Math.max(10, height - PAD_Y * 2);
    const minGain = -20;
    const maxGain = 20;
    const clampedY = Math.max(0, Math.min(usableH, y - PAD_Y));
    return maxGain - (clampedY / usableH) * (maxGain - minGain);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width || 800;
    const height = canvas.height || 240;

    const isLight = document.documentElement.classList.contains("light");

    const bgColor = isLight ? "#f8f8fb" : "#0c0e14";
    const gridColor = isLight ? "rgba(0, 0, 0, 0.07)" : "rgba(255, 255, 255, 0.08)";
    const textColor = isLight ? "rgba(0, 0, 0, 0.65)" : "rgba(255, 255, 255, 0.65)";
    const zeroColor = isLight ? "rgba(0, 122, 255, 0.45)" : "rgba(10, 132, 255, 0.45)";
    const curveColor = isLight ? "#007AFF" : "#0A84FF";

    // Canvas background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Vertical Frequency Grid Lines & Labels
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    const fGrids = [
      { f: 50, label: "50 Hz" },
      { f: 100, label: "100 Hz" },
      { f: 250, label: "250 Hz" },
      { f: 500, label: "500 Hz" },
      { f: 1000, label: "1 kHz" },
      { f: 2000, label: "2 kHz" },
      { f: 4000, label: "4 kHz" },
      { f: 8000, label: "8 kHz" },
      { f: 16000, label: "16 kHz" },
    ];

    fGrids.forEach(({ f, label }) => {
      const gx = freqToX(f, width);
      ctx.beginPath();
      ctx.moveTo(gx, PAD_Y - 8);
      ctx.lineTo(gx, height - PAD_Y + 8);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = "bold 9.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace";
      ctx.textAlign = "center";
      ctx.fillText(label, gx, height - 6);
    });

    // Horizontal dB Grid Lines & Labels
    const dBGrids = [18, 12, 6, 0, -6, -12, -18];
    dBGrids.forEach((g) => {
      const gy = gainToY(g, height);
      ctx.beginPath();
      if (g === 0) {
        ctx.strokeStyle = zeroColor;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
      } else {
        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
      }
      ctx.moveTo(PAD_X - 10, gy);
      ctx.lineTo(width - PAD_X + 10, gy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = g === 0 ? (isLight ? "#007AFF" : "#0A84FF") : textColor;
      ctx.font = "bold 9px -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${g > 0 ? "+" : ""}${g} dB`, 6, gy + 3);
    });

    // Compute curve points (preamp = 0 so the filter curve aligns with filter nodes!)
    const points: { x: number; y: number }[] = [];
    const sampleCount = 320;
    const zeroY = gainToY(0, height);

    for (let i = 0; i <= sampleCount; i++) {
      const x = PAD_X + (i / sampleCount) * (width - PAD_X * 2);
      const freq = xToFreq(x, width);
      const totalGain = EQEngine.calculateCombinedResponse(
        audioState?.parametricFilters || [],
        freq,
        0, // Always 0 here so the curve passes right through the filter control points!
        audioState?.bassBoost ?? 0,
        audioState?.trebleAir ?? 0,
        audioState?.graphicFilters || {},
        audioState?.mode || "parametric"
      );
      const y = gainToY(totalGain, height);
      points.push({ x, y });
    }

    // Fill under curve
    if (points.length > 0 && points[0]) {
      const grad = ctx.createLinearGradient(0, PAD_Y, 0, height);
      if (isLight) {
        grad.addColorStop(0, "rgba(0, 122, 255, 0.18)");
        grad.addColorStop(0.6, "rgba(94, 92, 230, 0.06)");
        grad.addColorStop(1, "rgba(0, 122, 255, 0.0)");
      } else {
        grad.addColorStop(0, "rgba(10, 132, 255, 0.35)");
        grad.addColorStop(0.6, "rgba(94, 92, 230, 0.12)");
        grad.addColorStop(1, "rgba(10, 132, 255, 0.0)");
      }

      ctx.beginPath();
      ctx.moveTo(points[0].x, zeroY);
      points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
      ctx.lineTo(points[points.length - 1]!.x, zeroY);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Main glow curve
      ctx.shadowColor = isLight ? "rgba(0, 122, 255, 0.35)" : "rgba(10, 132, 255, 0.60)";
      ctx.shadowBlur = isLight ? 4 : 8;
      ctx.strokeStyle = curveColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      points.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw draggable filter nodes in parametric mode
    if (audioState?.mode === "parametric" && Array.isArray(audioState?.parametricFilters)) {
      audioState.parametricFilters.forEach((f, idx) => {
        if (!f || !f.enabled) return;
        const nx = freqToX(f.freq || 1000, width);
        const ny = gainToY(f.gain || 0, height);
        const isHover = hoveredNode === idx || draggedNode === idx;
        const color = NODE_COLORS[idx % NODE_COLORS.length];

        ctx.beginPath();
        ctx.arc(nx, ny, isHover ? 7.5 : 5.5, 0, Math.PI * 2);
        ctx.fillStyle = color || "#0A84FF";
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = isLight ? "#1c1c1e" : "#ffffff";
        ctx.font = "bold 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(idx + 1), nx, ny - 9);
      });
    }
  }, [audioState, hoveredNode, draggedNode, freqToX, xToFreq, gainToY]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (audioState?.mode === "parametric" && Array.isArray(audioState?.parametricFilters)) {
      let foundIndex = -1;
      audioState.parametricFilters.forEach((f, idx) => {
        if (!f) return;
        const nx = freqToX(f.freq || 1000, canvas.width);
        const ny = gainToY(f.gain || 0, canvas.height);
        const dist = Math.hypot(mouseX - nx, mouseY - ny);
        if (dist < 18) {
          foundIndex = idx;
        }
      });

      if (foundIndex !== -1) {
        setDraggedNode(foundIndex);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (draggedNode !== null && audioState?.mode === "parametric") {
      const newFreq = Math.round(xToFreq(mouseX, canvas.width));
      const newGain = parseFloat(yToGain(mouseY, canvas.height).toFixed(1));
      updateParametricFilter(draggedNode, { freq: newFreq, gain: newGain });
      return;
    }

    if (audioState?.mode === "parametric" && Array.isArray(audioState?.parametricFilters)) {
      let foundIndex = -1;
      audioState.parametricFilters.forEach((f, idx) => {
        if (!f) return;
        const nx = freqToX(f.freq || 1000, canvas.width);
        const ny = gainToY(f.gain || 0, canvas.height);
        if (Math.hypot(mouseX - nx, mouseY - ny) < 18) {
          foundIndex = idx;
        }
      });
      setHoveredNode(foundIndex !== -1 ? foundIndex : null);
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (hoveredNode !== null && audioState?.mode === "parametric") {
      e.preventDefault();
      const current = audioState.parametricFilters?.[hoveredNode];
      if (current) {
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        const curQ = current.q ?? 1.41;
        const newQ = Math.max(0.1, Math.min(20, parseFloat((curQ + delta).toFixed(2))));
        updateParametricFilter(hoveredNode, { q: newQ });
      }
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (audioState?.mode === "parametric") {
      if (hoveredNode !== null) {
        updateParametricFilter(hoveredNode, { gain: 0 });
      } else {
        const f = Math.round(xToFreq(mouseX, canvas.width));
        const g = parseFloat(yToGain(mouseY, canvas.height).toFixed(1));
        addParametricFilter({ freq: f, gain: g, type: "PK", q: 1.41 });
      }
    }
  };

  return (
    <div className="apple-card p-5 select-none space-y-4">
      <div className="flex items-center justify-between border-b border-[color:var(--card-border)] pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#0A84FF]" />
          <h3 className="text-xs font-bold text-[color:var(--text-primary)] uppercase tracking-wider">
            Courbe de Réponse Fréquentielle Interactive
          </h3>
        </div>
        <span className="text-[11px] text-tertiary font-mono">
          Échelle logarithmique 20 Hz – 20 kHz (±20 dB)
        </span>
      </div>

      <div className="apple-inner-box p-3 sm:p-3.5 rounded-2xl">
        <div className="relative w-full rounded-xl overflow-hidden border border-[color:var(--card-border-inner)] shadow-inner">
          <canvas
            ref={canvasRef}
            width={800}
            height={240}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              setDraggedNode(null);
              setHoveredNode(null);
            }}
            onWheel={handleWheel}
            onDoubleClick={handleDoubleClick}
            className="w-full h-[240px] block cursor-crosshair"
          />
        </div>

        {/* Clean, spacious legend underneath */}
        <div className="mt-2.5 flex items-center justify-center gap-4 text-[11px] text-tertiary">
          <span><strong className="text-secondary font-medium">Glisser nœud :</strong> Fréquence / Gain</span>
          <span>•</span>
          <span><strong className="text-secondary font-medium">Molette :</strong> Facteur Q</span>
          <span>•</span>
          <span><strong className="text-secondary font-medium">Double-clic :</strong> Réinitialiser nœud</span>
        </div>
      </div>
    </div>
  );
};
