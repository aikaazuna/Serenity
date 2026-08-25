import React, { useRef, useEffect, useState, useCallback } from "react";
import { useAudioStore } from "@/state/audioStore";
import { useI18n } from "@/hooks/useI18n";
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
  const t = useI18n();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 240 });
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [draggedNode, setDraggedNode] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setDimensions({
            width: Math.round(entry.contentRect.width),
            height: 240,
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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

    const targetW = dimensions.width || containerRef.current?.clientWidth || 800;
    const targetH = 240;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(targetW * dpr);
    canvas.height = Math.round(targetH * dpr);
    canvas.style.width = `${targetW}px`;
    canvas.style.height = `${targetH}px`;

    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);

    const width = targetW;
    const height = targetH;

    const isLight = document.documentElement.classList.contains("light");

    const bgColor = isLight ? "#f8f8fb" : "#0c0e14";
    const gridColor = isLight ? "rgba(0, 0, 0, 0.07)" : "rgba(255, 255, 255, 0.08)";
    const textColor = isLight ? "rgba(0, 0, 0, 0.65)" : "rgba(255, 255, 255, 0.65)";
    const zeroColor = isLight ? "rgba(0, 122, 255, 0.45)" : "rgba(10, 132, 255, 0.45)";
    const curveColor = isLight ? "#007AFF" : "#0A84FF";

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

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

    const points: { x: number; y: number }[] = [];
    const sampleCount = 320;
    const zeroY = gainToY(0, height);

    for (let i = 0; i <= sampleCount; i++) {
      const x = PAD_X + (i / sampleCount) * (width - PAD_X * 2);
      const freq = xToFreq(x, width);
      const totalGain = EQEngine.calculateCombinedResponse(
        audioState?.parametricFilters || [],
        freq,
        0,
        audioState?.bassBoost ?? 0,
        audioState?.trebleAir ?? 0,
        audioState?.graphicFilters || {},
        audioState?.mode || "parametric"
      );
      const y = gainToY(totalGain, height);
      points.push({ x, y });
    }

    if (points.length > 0 && points[0]) {
      const gradient = ctx.createLinearGradient(0, PAD_Y, 0, height - PAD_Y);
      if (isLight) {
        gradient.addColorStop(0, "rgba(0, 122, 255, 0.16)");
        gradient.addColorStop(0.5, "rgba(0, 122, 255, 0.04)");
        gradient.addColorStop(1, "rgba(0, 122, 255, 0.16)");
      } else {
        gradient.addColorStop(0, "rgba(10, 132, 255, 0.28)");
        gradient.addColorStop(0.5, "rgba(10, 132, 255, 0.06)");
        gradient.addColorStop(1, "rgba(10, 132, 255, 0.28)");
      }

      ctx.beginPath();
      ctx.moveTo(points[0].x, zeroY);
      points.forEach((pt) => ctx.lineTo(pt.x, pt.y));
      const lastPt = points[points.length - 1];
      if (lastPt) {
        ctx.lineTo(lastPt.x, zeroY);
      }
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    if (points.length > 0 && points[0]) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const pt = points[i];
        if (pt) ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = curveColor;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }

    if (audioState?.mode === "parametric" && Array.isArray(audioState.parametricFilters)) {
      audioState.parametricFilters.forEach((filter, index) => {
        if (!filter || !filter.enabled) return;

        const nx = freqToX(filter.freq || 1000, width);
        const ny = gainToY(filter.gain || 0, height);
        const isHovered = hoveredNode === index;
        const isDragged = draggedNode === index;
        const color = NODE_COLORS[index % NODE_COLORS.length] || "#0A84FF";

        if (isHovered || isDragged) {
          const qVal = filter.q ?? 1.41;
          const bwOctaves = 2 * Math.asinh(1 / (2 * qVal)) / Math.LN2;
          const fLow = (filter.freq || 1000) * Math.pow(2, -bwOctaves / 2);
          const fHigh = (filter.freq || 1000) * Math.pow(2, bwOctaves / 2);
          const xLow = freqToX(fLow, width);
          const xHigh = freqToX(fHigh, width);

          ctx.fillStyle = `${color}18`;
          ctx.fillRect(Math.min(xLow, xHigh), PAD_Y, Math.abs(xHigh - xLow), height - PAD_Y * 2);

          ctx.strokeStyle = `${color}60`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(xLow, PAD_Y);
          ctx.lineTo(xLow, height - PAD_Y);
          ctx.moveTo(xHigh, PAD_Y);
          ctx.lineTo(xHigh, height - PAD_Y);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.moveTo(nx, zeroY);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = isHovered || isDragged ? color : `${color}80`;
        ctx.lineWidth = isHovered || isDragged ? 1.5 : 1;
        ctx.stroke();

        if (isHovered || isDragged) {
          ctx.beginPath();
          ctx.arc(nx, ny, 11, 0, Math.PI * 2);
          ctx.fillStyle = `${color}35`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(nx, ny, isHovered || isDragged ? 6.5 : 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = textColor;
        ctx.font = "bold 9px -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace";
        ctx.textAlign = "center";
        const badgeY = ny < PAD_Y + 14 ? ny + 14 : ny - 9;
        ctx.fillText(`${index + 1}`, nx, badgeY);
      });
    }
  }, [
    dimensions.width,
    audioState,
    hoveredNode,
    draggedNode,
    freqToX,
    xToFreq,
    gainToY,
  ]);

  const getNodeAtPos = (clientX: number, clientY: number): number | null => {
    const canvas = canvasRef.current;
    if (!canvas || !audioState?.parametricFilters) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;
    const width = dimensions.width || rect.width;
    const height = 240;

    for (let i = 0; i < audioState.parametricFilters.length; i++) {
      const f = audioState.parametricFilters[i];
      if (!f || !f.enabled) continue;
      const nx = freqToX(f.freq || 1000, width);
      const ny = gainToY(f.gain || 0, height);
      const dist = Math.hypot(mouseX - nx, mouseY - ny);
      if (dist <= 14) return i;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (audioState?.mode !== "parametric") return;
    const nodeIdx = getNodeAtPos(e.clientX, e.clientY);
    if (nodeIdx !== null) {
      setDraggedNode(nodeIdx);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (audioState?.mode !== "parametric") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const width = dimensions.width || rect.width;
    const height = 240;

    if (draggedNode !== null) {
      const newFreq = Math.round(xToFreq(mouseX, width));
      const newGain = parseFloat(yToGain(mouseY, height).toFixed(1));
      updateParametricFilter(draggedNode, {
        freq: Math.max(20, Math.min(20000, newFreq)),
        gain: Math.max(-20, Math.min(20, newGain)),
      });
    } else {
      const nodeIdx = getNodeAtPos(e.clientX, e.clientY);
      setHoveredNode(nodeIdx);
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

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const width = dimensions.width || rect.width;
    const height = 240;

    if (audioState?.mode === "parametric") {
      if (hoveredNode !== null) {
        updateParametricFilter(hoveredNode, { gain: 0 });
      } else {
        const f = Math.round(xToFreq(mouseX, width));
        const g = parseFloat(yToGain(mouseY, height).toFixed(1));
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
            {t.audioCurve.title}
          </h3>
        </div>
        <span className="text-[11px] text-tertiary font-mono">
          {t.audioCurve.scale}
        </span>
      </div>

      <div className="apple-inner-box p-3 sm:p-3.5 rounded-2xl">
        <div
          ref={containerRef}
          className="relative w-full rounded-xl overflow-hidden border border-[color:var(--card-border-inner)] shadow-inner"
        >
          <canvas
            ref={canvasRef}
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

        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] text-tertiary">
          <span><strong className="text-secondary font-medium">{t.audioCurve.dragNode}</strong> {t.audioCurve.dragNodeDesc}</span>
          <span className="hidden sm:inline">•</span>
          <span><strong className="text-secondary font-medium">{t.audioCurve.scrollQ}</strong> {t.audioCurve.scrollQDesc}</span>
          <span className="hidden sm:inline">•</span>
          <span><strong className="text-secondary font-medium">{t.audioCurve.doubleClickReset}</strong> {t.audioCurve.doubleClickResetDesc}</span>
        </div>
      </div>
    </div>
  );
};
