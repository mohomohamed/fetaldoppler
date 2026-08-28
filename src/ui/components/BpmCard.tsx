import React from 'react';
import { FhrEstimationResult } from '../../domain/types';
import { Heart, AlertCircle, RefreshCw } from 'lucide-react';

interface BpmCardProps {
  estimation: FhrEstimationResult | null;
  isCapturing: boolean;
}

export const BpmCard: React.FC<BpmCardProps> = ({ estimation, isCapturing }) => {
  const bpm = estimation?.estimatedBpm;
  const confidence = estimation?.confidence ?? 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800/80 p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Heart className={`h-4 w-4 ${bpm ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Estimated FHR
            </span>
            <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-400">
              BPM
            </span>
          </div>
        </div>

        {/* Warning Badges */}
        <div className="flex items-center space-x-1.5">
          {estimation?.isHarmonicCorrected && (
            <div className="flex items-center space-x-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
              <RefreshCw className="h-2.5 w-2.5" />
              <span>Octave Guard</span>
            </div>
          )}

          {estimation?.isMaternalWarning && (
            <div className="flex items-center space-x-1 rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-400 border border-rose-500/20">
              <AlertCircle className="h-2.5 w-2.5" />
              <span>Maternal Rate?</span>
            </div>
          )}
        </div>
      </div>

      {/* Large BPM Display */}
      <div className="my-4 flex items-baseline justify-center space-x-3">
        <span
          className={`font-mono text-6xl sm:text-7xl font-extrabold tracking-tight transition-all duration-150 ${
            bpm !== null && bpm !== undefined
              ? 'text-white drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]'
              : 'text-zinc-700'
          }`}
        >
          {isCapturing && bpm !== null && bpm !== undefined ? bpm : '---'}
        </span>
        <span className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
          bpm
        </span>
      </div>

      {/* Confidence Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-zinc-400">
          <span>Tracking Stability</span>
          <span className="font-mono text-zinc-300">
            {bpm ? `${(confidence * 100).toFixed(0)}%` : 'Gating Active'}
          </span>
        </div>
        <div className="h-1.5 w-full bg-zinc-800/80 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              confidence > 0.65
                ? 'bg-emerald-500'
                : confidence > 0.4
                ? 'bg-cyan-500'
                : 'bg-zinc-700'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, confidence * 100))}%` }}
          />
        </div>
      </div>

      {/* Safety Notice Footer */}
      <div className="mt-4 pt-3 border-t border-zinc-800/60 text-center">
        <p className="text-[10px] text-zinc-500 font-medium">
          Experimental signal processing prototype • Not for clinical diagnosis
        </p>
      </div>
    </div>
  );
};
