import React from 'react';
import { SignalMetrics } from '../../domain/types';

interface LevelMeterProps {
  metrics: SignalMetrics;
}

export const LevelMeter: React.FC<LevelMeterProps> = ({ metrics }) => {
  // Convert rms to percentage (0 dBFS = 100%, -60 dBFS = 0%)
  const minDb = -60;
  const clampedDb = Math.max(minDb, Math.min(0, metrics.rmsDb));
  const percent = ((clampedDb - minDb) / -minDb) * 100;

  const peakDb = 20 * Math.log10(Math.max(1e-5, metrics.peak));
  const peakPercent = ((Math.max(minDb, Math.min(0, peakDb)) - minDb) / -minDb) * 100;

  return (
    <div className="flex flex-col space-y-1.5 bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400 font-medium">Input Level</span>
        <div className="flex items-center space-x-2">
          <span className="font-mono text-zinc-300">
            {metrics.rmsDb > -99 ? `${metrics.rmsDb.toFixed(1)} dBFS` : '-inf dB'}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wider ${
              metrics.clipping
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            CLIP
          </span>
        </div>
      </div>

      <div className="relative h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/80">
        {/* RMS Level bar */}
        <div
          className={`h-full rounded-full transition-all duration-75 ${
            metrics.clipping
              ? 'bg-rose-500'
              : metrics.rmsDb > -6
              ? 'bg-amber-400'
              : 'bg-emerald-500'
          }`}
          style={{ width: `${percent}%` }}
        />
        {/* Peak tick indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-cyan-300 shadow-sm"
          style={{ left: `${Math.min(99, peakPercent)}%` }}
        />
      </div>

      <div className="flex justify-between text-[9px] text-zinc-600 font-mono px-0.5">
        <span>-60 dB</span>
        <span>-30 dB</span>
        <span>-12 dB</span>
        <span>-3 dB</span>
        <span>0 dB</span>
      </div>
    </div>
  );
};
