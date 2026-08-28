import React from 'react';
import { Play, Square, Circle, Radio, AlertTriangle } from 'lucide-react';
import { WaveformCanvas } from '../components/WaveformCanvas';
import { LevelMeter } from '../components/LevelMeter';
import { BpmCard } from '../components/BpmCard';
import { SignalQualityBadge } from '../components/SignalQualityBadge';
import {
  FhrEstimationResult,
  SignalMetrics,
  VerifiedTrackSettings,
} from '../../domain/types';

interface MonitorViewProps {
  isCapturing: boolean;
  isRecording: boolean;
  recordingDurationSeconds: number;
  waveformSamples: Float32Array;
  sampleRate: number;
  metrics: SignalMetrics;
  estimation: FhrEstimationResult | null;
  trackSettings: VerifiedTrackSettings | null;
  onToggleCapture: () => void;
  onToggleRecord: () => void;
  onAddMarker: (label: string) => void;
}

export const MonitorView: React.FC<MonitorViewProps> = ({
  isCapturing,
  isRecording,
  recordingDurationSeconds,
  waveformSamples,
  sampleRate,
  metrics,
  estimation,
  trackSettings,
  onToggleCapture,
  onToggleRecord,
  onAddMarker,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 pb-24 max-w-2xl mx-auto px-4 pt-2">
      {/* Track Verification Warnings (if any) */}
      {trackSettings && trackSettings.warnings.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-300">
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <AlertTriangle className="h-4 w-4" />
            <span>Audio Configuration Notice</span>
          </div>
          <ul className="mt-1.5 space-y-0.5 text-[11px] text-amber-200/90 list-disc list-inside">
            {trackSettings.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* BPM Display Card */}
      <BpmCard estimation={estimation} isCapturing={isCapturing} />

      {/* Quality Badge & Level Meter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SignalQualityBadge
          quality={estimation?.quality || 'unusable'}
          confidence={estimation?.confidence || 0}
        />
        <LevelMeter metrics={metrics} />
      </div>

      {/* Real-time Oscilloscope Waveform */}
      <WaveformCanvas
        samples={waveformSamples}
        sampleRate={sampleRate}
        height={140}
        autoGain={true}
      />

      {/* Live Capture & Record Controls */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className={`h-4 w-4 ${isCapturing ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Capture Engine
            </span>
          </div>
          {isRecording && (
            <div className="flex items-center space-x-2 font-mono text-sm text-rose-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <span>{formatTime(recordingDurationSeconds)}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Capture Start/Stop */}
          <button
            onClick={onToggleCapture}
            className={`flex items-center justify-center space-x-2 rounded-xl py-3 px-4 text-sm font-semibold transition-all shadow-md ${
              isCapturing
                ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                : 'bg-cyan-500 text-zinc-950 hover:bg-cyan-400 font-bold'
            }`}
          >
            {isCapturing ? (
              <>
                <Square className="h-4 w-4 fill-current" />
                <span>Stop Stream</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                <span>Start Stream</span>
              </>
            )}
          </button>

          {/* Record Start/Stop */}
          <button
            onClick={onToggleRecord}
            disabled={!isCapturing}
            className={`flex items-center justify-center space-x-2 rounded-xl py-3 px-4 text-sm font-semibold transition-all shadow-md ${
              !isCapturing
                ? 'bg-zinc-800/40 text-zinc-600 cursor-not-allowed border border-zinc-800'
                : isRecording
                ? 'bg-rose-600 text-white hover:bg-rose-500 font-bold animate-pulse'
                : 'bg-zinc-800 text-rose-400 hover:bg-zinc-700 border border-zinc-700'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="h-4 w-4 fill-current" />
                <span>Stop Record</span>
              </>
            ) : (
              <>
                <Circle className="h-4 w-4 fill-rose-500 text-rose-500" />
                <span>Record Session</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Marker Buttons when recording */}
        {isRecording && (
          <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">Quick Event Marker:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => onAddMarker('Fetal Movement')}
                className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700 border border-zinc-700"
              >
                + Movement
              </button>
              <button
                onClick={() => onAddMarker('Probe Shift')}
                className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700 border border-zinc-700"
              >
                + Shift
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
