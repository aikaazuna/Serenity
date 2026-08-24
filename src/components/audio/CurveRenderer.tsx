import React, { useRef, useEffect, useState } from 'react';
import { useAudioStore } from '../../state/audioStore';
import { EQEngine } from '../../lib/eq-engine';

export const CurveRenderer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 200 });

  const { mode, preamp, graphicFilters, parametricFilters } = useAudioStore();

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: 200
        });
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    const width = dimensions.width;
    const height = dimensions.height;

    // Constants
    const minFreq = 20;
    const maxFreq = 20000;
    const minDb = -20;
    const maxDb = 20;

    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);

    const freqToX = (f: number) => {
      const p = (Math.log10(f) - logMin) / (logMax - logMin);
      return p * width;
    };

    const dbToY = (db: number) => {
      const p = (db - minDb) / (maxDb - minDb);
      return height - (p * height); // Invert Y axis
    };

    // Draw background
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // Horizontal lines (dB)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    for (let db = minDb; db <= maxDb; db += 10) {
      const y = dbToY(db);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      if (db !== 0) {
        ctx.fillText(`${db > 0 ? '+' : ''}${db} dB`, 5, y - 8);
      }
    }

    // 0 dB center line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, dbToY(0));
    ctx.lineTo(width, dbToY(0));
    ctx.stroke();

    // Vertical lines (Freq)
    const freqsToDraw = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    freqsToDraw.forEach(f => {
      const x = freqToX(f);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      let text = f >= 1000 ? `${f/1000}k` : f.toString();
      ctx.fillText(text, x, height - 5);
    });

    // Determine active filters
    let filters: any[] = [];
    if (mode === 'parametric') {
      filters = parametricFilters;
    } else {
      // Convert graphic to parametric format for calculation
      Object.entries(graphicFilters).forEach(([freqStr, gain]) => {
        if (gain !== 0) {
          filters.push({
            enabled: true,
            type: 'PK',
            freq: parseFloat(freqStr),
            gain: gain,
            q: 1.41
          });
        }
      });
    }

    // Draw curve
    ctx.beginPath();
    let started = false;
    
    // Evaluate response at many points across log scale
    
    // Fill path
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(52, 211, 153, 0.3)'); // emerald-400
    gradient.addColorStop(0.5, 'rgba(52, 211, 153, 0.05)');
    gradient.addColorStop(1, 'rgba(52, 211, 153, 0)');
    
    ctx.beginPath();
    ctx.moveTo(0, height); // start at bottom left
    
    for (let x = 0; x <= width; x++) {
      const p = x / width;
      const freq = Math.pow(10, logMin + p * (logMax - logMin));
      
      const db = EQEngine.calculateCombinedResponse(filters, freq, preamp);
      const y = dbToY(Math.max(minDb, Math.min(maxDb, db)));
      
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(width, height); // end at bottom right
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw solid line on top
    ctx.beginPath();
    for (let x = 0; x <= width; x++) {
      const p = x / width;
      const freq = Math.pow(10, logMin + p * (logMax - logMin));
      
      const db = EQEngine.calculateCombinedResponse(filters, freq, preamp);
      const y = dbToY(Math.max(minDb, Math.min(maxDb, db)));
      
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = '#34d399'; // emerald-400
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [dimensions, mode, preamp, graphicFilters, parametricFilters]);

  return (
    <div ref={containerRef} className="w-full h-[200px] bg-[#15151e] rounded-xl overflow-hidden border border-white/5 relative">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};
