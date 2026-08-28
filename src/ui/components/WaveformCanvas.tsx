import React, { useRef, useEffect } from 'react';

interface WaveformCanvasProps {
  samples: Float32Array;
  sampleRate: number;
  height?: number;
  autoGain?: boolean;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  samples,
  height = 140,
  autoGain = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Support device pixel ratio
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = height;
    const halfH = h / 2;

    // Clear background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, w, h);

    // Draw Subtle Grid
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1;

    // Horizontal lines
    ctx.beginPath();
    ctx.moveTo(0, halfH * 0.5);
    ctx.lineTo(w, halfH * 0.5);
    ctx.moveTo(0, halfH * 1.5);
    ctx.lineTo(w, halfH * 1.5);
    ctx.stroke();

    // Center Zero Line
    ctx.strokeStyle = '#27272a';
    ctx.beginPath();
    ctx.moveTo(0, halfH);
    ctx.lineTo(w, halfH);
    ctx.stroke();

    const len = samples.length;
    if (len === 0) {
      return;
    }

    // Auto-gain calculation
    let maxAbs = 0.05;
    if (autoGain) {
      for (let i = 0; i < len; i += 8) {
        const abs = Math.abs(samples[i]);
        if (abs > maxAbs) maxAbs = abs;
      }
    }
    const gainScale = autoGain ? Math.min(25, 0.85 / maxAbs) : 1;

    // Draw Waveform Path
    ctx.strokeStyle = '#06b6d4'; // Cyan accent
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();

    const step = len / w;
    for (let x = 0; x < w; x++) {
      const idx = Math.floor(x * step);
      const sample = samples[idx] || 0;
      const y = halfH - sample * gainScale * (halfH * 0.85);

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }, [samples, height, autoGain]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="absolute top-2 left-2.5 z-10 flex items-center space-x-2">
        <span className="rounded bg-zinc-900/80 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-cyan-400 border border-zinc-800">
          Oscilloscope
        </span>
        <span className="text-[10px] text-zinc-500 font-mono">
          {autoGain ? 'Auto-Gain ON' : '1.0x Scale'}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full block"
        style={{ height: `${height}px` }}
      />
    </div>
  );
};
