import React, { useRef, useEffect } from 'react';

interface SpectrogramCanvasProps {
  frames: Float32Array[]; // Array of magnitude spectra
  height?: number;
}

export const SpectrogramCanvas: React.FC<SpectrogramCanvasProps> = ({ frames, height = 150 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || frames.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const numCols = frames.length;
    const numBins = frames[0].length;

    canvas.width = numCols;
    canvas.height = numBins;

    const imgData = ctx.createImageData(numCols, numBins);
    const data = imgData.data;

    // Colormap mapping (dBFS -80 to 0) -> Cyan / Purple / Amber / White
    for (let x = 0; x < numCols; x++) {
      const spectrum = frames[x];
      for (let y = 0; y < numBins; y++) {
        // Invert Y axis so low frequency is at bottom
        const binIndex = numBins - 1 - y;
        const db = spectrum[binIndex];
        const norm = Math.max(0, Math.min(1, (db + 80) / 80)); // 0.0 to 1.0

        const pixelIndex = (y * numCols + x) * 4;

        if (norm < 0.25) {
          // Deep navy / black
          data[pixelIndex] = 9;
          data[pixelIndex + 1] = 9;
          data[pixelIndex + 2] = 20 + norm * 80;
        } else if (norm < 0.6) {
          // Cyan / Teal
          const t = (norm - 0.25) / 0.35;
          data[pixelIndex] = 6 * (1 - t);
          data[pixelIndex + 1] = 100 + t * 155;
          data[pixelIndex + 2] = 180 + t * 75;
        } else if (norm < 0.85) {
          // Emerald / Amber
          const t = (norm - 0.6) / 0.25;
          data[pixelIndex] = 245 * t;
          data[pixelIndex + 1] = 200 + t * 30;
          data[pixelIndex + 2] = 40 * (1 - t);
        } else {
          // White hot peak
          const t = (norm - 0.85) / 0.15;
          data[pixelIndex] = 255;
          data[pixelIndex + 1] = 230 + t * 25;
          data[pixelIndex + 2] = 200 + t * 55;
        }

        data[pixelIndex + 3] = 255; // Alpha
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [frames]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="absolute top-2 left-2.5 z-10 flex items-center space-x-2">
        <span className="rounded bg-zinc-900/80 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-purple-400 border border-zinc-800">
          STFT Spectrogram (0 - 2 kHz)
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full block"
        style={{ height: `${height}px`, imageRendering: 'pixelated' }}
      />
    </div>
  );
};
