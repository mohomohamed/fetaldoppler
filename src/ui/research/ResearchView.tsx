import React, { useState } from 'react';
import { SpectrogramCanvas } from '../components/SpectrogramCanvas';
import { WaveformCanvas } from '../components/WaveformCanvas';
import { SpectrogramEngine } from '../../dsp/Spectrogram';
import { FhrEstimator } from '../../fhr/FhrEstimator';
import { WavFinalizer } from '../../recording/WavFinalizer';
import { Layers, Upload, Sparkles, RefreshCw } from 'lucide-react';

interface ResearchViewProps {
  liveSpectrogramFrames: Float32Array[];
}

export const ResearchView: React.FC<ResearchViewProps> = ({ liveSpectrogramFrames }) => {
  const [syntheticBpm, setSyntheticBpm] = useState<number>(140);
  const [analyzedSamples, setAnalyzedSamples] = useState<Float32Array | null>(null);
  const [analyzedSpectrogram, setAnalyzedSpectrogram] = useState<Float32Array[]>([]);
  const [estimatedResultBpm, setEstimatedResultBpm] = useState<number | null>(null);
  const [lowCut, setLowCut] = useState<number>(60);
  const [highCut, setHighCut] = useState<number>(1200);

  // Generate synthetic Doppler heartbeat audio for DSP validation
  const handleGenerateSynthetic = () => {
    const sampleRate = 44100;
    const durationSec = 3.0;
    const totalSamples = sampleRate * durationSec;
    const samples = new Float32Array(totalSamples);

    const beatIntervalSec = 60 / syntheticBpm;
    const beatIntervalSamples = Math.floor(beatIntervalSec * sampleRate);

    // Synthesize biphasic Doppler "whoosh-whoosh" pulses (carrier ~200-400Hz frequency-modulated)
    for (let i = 0; i < totalSamples; i++) {
      const beatPhase = (i % beatIntervalSamples) / sampleRate; // time within beat
      let envelope = 0;

      // Systolic main valve burst (~80ms)
      if (beatPhase < 0.08) {
        envelope = Math.sin((beatPhase / 0.08) * Math.PI);
      }
      // Diastolic secondary valve burst (~60ms)
      else if (beatPhase > 0.12 && beatPhase < 0.18) {
        envelope = 0.5 * Math.sin(((beatPhase - 0.12) / 0.06) * Math.PI);
      }

      // Doppler carrier frequency modulation (320 Hz)
      const carrier = Math.sin(2 * Math.PI * 320 * (i / sampleRate));
      const noise = (Math.random() - 0.5) * 0.05;

      samples[i] = (carrier * envelope + noise) * 0.5;
    }

    setAnalyzedSamples(samples);

    // Compute Spectrogram
    const spec = new SpectrogramEngine(512, 256, sampleRate);
    const frames = spec.computeFrames(samples);
    setAnalyzedSpectrogram(frames);

    // Run FHR Estimator
    const estimator = new FhrEstimator(sampleRate, {
      dcBlockerEnabled: true,
      bandpassLowCutHz: lowCut,
      bandpassHighCutHz: highCut,
      envelopeAttackMs: 15,
      envelopeDecayMs: 65,
      minFhrBpm: 50,
      maxFhrBpm: 240,
      confidenceThreshold: 0.35,
      maternalExclusionEnabled: true,
    });

    const { result } = estimator.processWindow(samples);
    setEstimatedResultBpm(result.estimatedBpm);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        try {
          const { samples, sampleRate } = WavFinalizer.decodeWav(reader.result);
          setAnalyzedSamples(samples);

          const spec = new SpectrogramEngine(512, 256, sampleRate);
          const frames = spec.computeFrames(samples);
          setAnalyzedSpectrogram(frames);

          const estimator = new FhrEstimator(sampleRate, {
            dcBlockerEnabled: true,
            bandpassLowCutHz: lowCut,
            bandpassHighCutHz: highCut,
            envelopeAttackMs: 15,
            envelopeDecayMs: 65,
            minFhrBpm: 50,
            maxFhrBpm: 240,
            confidenceThreshold: 0.35,
            maternalExclusionEnabled: true,
          });
          const { result } = estimator.processWindow(samples);
          setEstimatedResultBpm(result.estimatedBpm);
        } catch (err) {
          alert('Error parsing WAV audio: ' + err);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-5 pb-24 max-w-2xl mx-auto px-4 pt-2">
      <div>
        <h2 className="text-lg font-bold text-zinc-100 flex items-center space-x-2">
          <Layers className="h-5 w-5 text-purple-400" />
          <span>Research Lab & DSP Workbench</span>
        </h2>
        <p className="text-xs text-zinc-400">
          Spectrogram frequency analysis, synthetic signal generation & non-destructive algorithm benchmarking.
        </p>
      </div>

      {/* Live / Analyzed Spectrogram */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          {analyzedSpectrogram.length > 0 ? 'Analyzed Audio Spectrogram' : 'Live Stream Spectrogram'}
        </span>
        <SpectrogramCanvas
          frames={analyzedSpectrogram.length > 0 ? analyzedSpectrogram : liveSpectrogramFrames}
          height={160}
        />
      </div>

      {/* Filter tuning sliders */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
          Benchmarking DSP Cutoffs
        </span>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-zinc-400">Low Cut: {lowCut} Hz</span>
            <input
              type="range"
              min="30"
              max="150"
              value={lowCut}
              onChange={(e) => setLowCut(Number(e.target.value))}
              className="w-full accent-purple-500 mt-1"
            />
          </div>
          <div>
            <span className="text-zinc-400">High Cut: {highCut} Hz</span>
            <input
              type="range"
              min="500"
              max="2000"
              step="50"
              value={highCut}
              onChange={(e) => setHighCut(Number(e.target.value))}
              className="w-full accent-purple-500 mt-1"
            />
          </div>
        </div>
      </div>

      {/* Synthetic Doppler Signal Generator */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-semibold text-zinc-200">Synthetic Doppler Pulse Generator</span>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-bold">{syntheticBpm} Target BPM</span>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="range"
            min="60"
            max="200"
            step="1"
            value={syntheticBpm}
            onChange={(e) => setSyntheticBpm(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <button
            onClick={handleGenerateSynthetic}
            className="flex items-center space-x-1.5 rounded-xl bg-cyan-500 px-3.5 py-2 text-xs font-bold text-zinc-950 hover:bg-cyan-400 whitespace-nowrap"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Generate & Test</span>
          </button>
        </div>

        {estimatedResultBpm !== null && (
          <div className="rounded-xl bg-zinc-950 p-3 border border-zinc-800 flex justify-between items-center text-xs">
            <span className="text-zinc-400">DSP Autocorrelation Output:</span>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {estimatedResultBpm} BPM
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                (Δ {Math.abs(estimatedResultBpm - syntheticBpm)} BPM)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* WAV Import */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <Upload className="h-4 w-4 text-purple-400" />
          <span className="text-xs font-semibold text-zinc-200">Import WAV for DSP Reprocessing</span>
        </div>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 p-4 hover:border-purple-500/50 transition-all">
          <Upload className="h-6 w-6 text-zinc-500 mb-1" />
          <span className="text-xs text-zinc-300 font-medium">Click to select standard WAV file</span>
          <span className="text-[10px] text-zinc-500">16-bit or 32-bit PCM</span>
          <input type="file" accept=".wav,audio/wav" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {analyzedSamples && (
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Synthesized / Imported Audio Waveform
          </span>
          <WaveformCanvas samples={analyzedSamples} sampleRate={44100} height={100} autoGain={true} />
        </div>
      )}
    </div>
  );
};
