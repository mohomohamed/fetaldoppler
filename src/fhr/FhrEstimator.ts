import {
  DspConfiguration,
  DEFAULT_DSP_CONFIG,
  FhrEstimationResult,
  SignalMetrics,
} from '../domain/types';
import { DcBlocker } from '../dsp/DcBlocker';
import { DopplerBandpassFilter } from '../dsp/Filters';
import { SpikeSuppressor } from '../dsp/SpikeSuppressor';
import { EnvelopeFollower } from '../dsp/Envelope';
import { AutocorrelationEngine } from '../dsp/Autocorrelation';
import { HarmonicGuard } from './HarmonicGuard';
import { MaternalGuard } from './MaternalGuard';
import { SignalQualityEngine } from './SignalQualityEngine';

export class FhrEstimator {
  private config: DspConfiguration;
  private dcBlocker: DcBlocker;
  private bandpassFilter: DopplerBandpassFilter;
  private spikeSuppressor: SpikeSuppressor;
  private envelopeFollower: EnvelopeFollower;
  private qualityEngine: SignalQualityEngine;

  private sampleRate: number;
  private smoothedBpm: number | null = null;
  private staleBpmFrames = 0;
  private readonly maxStaleFrames = 5; // Clear BPM after 5 low-confidence frames

  constructor(sampleRate = 44100, config: DspConfiguration = DEFAULT_DSP_CONFIG) {
    this.sampleRate = sampleRate;
    this.config = { ...config };

    this.dcBlocker = new DcBlocker(0.995);
    this.bandpassFilter = new DopplerBandpassFilter(
      config.bandpassLowCutHz,
      config.bandpassHighCutHz,
      sampleRate
    );
    this.spikeSuppressor = new SpikeSuppressor(0.2);
    this.envelopeFollower = new EnvelopeFollower(
      config.envelopeAttackMs,
      config.envelopeDecayMs,
      sampleRate
    );
    this.qualityEngine = new SignalQualityEngine();
  }

  public updateConfig(newConfig: Partial<DspConfiguration>): void {
    this.config = { ...this.config, ...newConfig };
    this.bandpassFilter.configure(
      this.config.bandpassLowCutHz,
      this.config.bandpassHighCutHz,
      this.sampleRate
    );
    this.envelopeFollower.setTiming(
      this.config.envelopeAttackMs,
      this.config.envelopeDecayMs,
      this.sampleRate
    );
  }

  public setSampleRate(sampleRate: number): void {
    this.sampleRate = sampleRate;
    this.bandpassFilter.configure(
      this.config.bandpassLowCutHz,
      this.config.bandpassHighCutHz,
      sampleRate
    );
    this.envelopeFollower.setTiming(
      this.config.envelopeAttackMs,
      this.config.envelopeDecayMs,
      sampleRate
    );
  }

  /**
   * Process a sliding window of raw audio samples (typically 2 - 3 seconds).
   */
  public processWindow(rawSamples: Float32Array, isDropout = false): {
    result: FhrEstimationResult;
    metrics: SignalMetrics;
    filteredSamples: Float32Array;
    envelopeSamples: Float32Array;
  } {
    const N = rawSamples.length;
    const filtered = new Float32Array(N);
    const envelope = new Float32Array(N);

    // 1. Metric computation on raw audio
    const metrics = this.qualityEngine.computeMetrics(rawSamples);

    // 2. DC Blocking & Transient suppression
    for (let i = 0; i < N; i++) {
      let s = rawSamples[i];
      if (this.config.dcBlockerEnabled) {
        s = this.dcBlocker.processSample(s);
      }
      s = this.spikeSuppressor.processSample(s);
      filtered[i] = this.bandpassFilter.processSample(s);
      envelope[i] = this.envelopeFollower.processSample(filtered[i]);
    }

    // 3. Autocorrelation on envelope
    const { peaks } = AutocorrelationEngine.compute(
      envelope,
      this.config.minFhrBpm,
      this.config.maxFhrBpm,
      this.sampleRate
    );

    // 4. Harmonic resolution
    const { resolvedBpm, isHarmonicCorrected, confidence } = HarmonicGuard.resolve(
      peaks,
      this.smoothedBpm
    );

    // 5. Maternal rate check
    const { isMaternalWarning } = MaternalGuard.check(resolvedBpm, peaks);

    // 6. Signal Quality assessment
    const quality = this.qualityEngine.assessQuality(metrics, confidence, isDropout);

    // 7. Output BPM stabilization & Confidence Gating
    let estimatedBpm: number | null = null;
    const rawBpm = resolvedBpm > 0 ? resolvedBpm : null;

    if (confidence >= this.config.confidenceThreshold && quality !== 'unusable' && !isDropout && rawBpm) {
      this.staleBpmFrames = 0;
      if (this.smoothedBpm === null) {
        this.smoothedBpm = rawBpm;
      } else {
        // Exponential smoothing (alpha = 0.35)
        this.smoothedBpm = 0.35 * rawBpm + 0.65 * this.smoothedBpm;
      }
      estimatedBpm = Math.round(this.smoothedBpm);
    } else {
      this.staleBpmFrames++;
      if (this.staleBpmFrames >= this.maxStaleFrames) {
        this.smoothedBpm = null;
      }
      estimatedBpm = this.smoothedBpm !== null ? Math.round(this.smoothedBpm) : null;
    }

    const result: FhrEstimationResult = {
      estimatedBpm,
      rawBpm,
      confidence,
      quality,
      timestampMs: Date.now(),
      candidates: peaks.map((p) => ({
        bpm: p.bpm,
        score: p.coefficient,
        type: 'autocorrelation',
      })),
      isHarmonicCorrected,
      isMaternalWarning,
      isDropout,
    };

    return {
      result,
      metrics,
      filteredSamples: filtered,
      envelopeSamples: envelope,
    };
  }

  public reset(): void {
    this.dcBlocker.reset();
    this.bandpassFilter.reset();
    this.spikeSuppressor.reset();
    this.envelopeFollower.reset();
    this.qualityEngine.reset();
    this.smoothedBpm = null;
    this.staleBpmFrames = 0;
  }
}
