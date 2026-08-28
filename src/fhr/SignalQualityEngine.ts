import { SignalMetrics, SignalQualityLevel } from '../domain/types';

export class SignalQualityEngine {
  private currentQuality: SignalQualityLevel = 'unusable';
  private qualityStreak = 0;
  private targetQuality: SignalQualityLevel = 'unusable';

  /**
   * Computes instant signal metrics from a raw audio window.
   */
  public computeMetrics(samples: Float32Array): SignalMetrics {
    const N = samples.length;
    if (N === 0) {
      return {
        rms: 0,
        rmsDb: -100,
        peak: 0,
        dcOffset: 0,
        clipping: false,
        clipCount: 0,
        snrEstimate: 0,
        dominantFrequency: 0,
      };
    }

    let sum = 0;
    let sumSq = 0;
    let peak = 0;
    let clipCount = 0;

    for (let i = 0; i < N; i++) {
      const s = samples[i];
      const absS = Math.abs(s);
      sum += s;
      sumSq += s * s;
      if (absS > peak) peak = absS;
      if (absS >= 0.99) clipCount++;
    }

    const dcOffset = sum / N;
    const rms = Math.sqrt(sumSq / N);
    const rmsDb = 20 * Math.log10(Math.max(1e-5, rms));

    // Approximate SNR: ratio of RMS to estimated noise floor (-45 dB baseline)
    const noiseFloorLinear = 0.005; // -46 dB
    const snrEstimate = 20 * Math.log10(Math.max(1, rms / noiseFloorLinear));

    return {
      rms,
      rmsDb,
      peak,
      dcOffset,
      clipping: clipCount > 0,
      clipCount,
      snrEstimate,
      dominantFrequency: 0,
    };
  }

  /**
   * Assesses quality with hysteresis smoothing.
   */
  public assessQuality(
    metrics: SignalMetrics,
    peakCorrelation: number,
    isDropout: boolean
  ): SignalQualityLevel {
    if (isDropout || metrics.rms < 0.003 || metrics.clipCount > 50) {
      this.updateQualityState('unusable');
      return this.currentQuality;
    }

    let rawQuality: SignalQualityLevel = 'unusable';

    if (peakCorrelation >= 0.65 && metrics.rms >= 0.02 && !metrics.clipping) {
      rawQuality = 'strong';
    } else if (peakCorrelation >= 0.45 && metrics.rms >= 0.008) {
      rawQuality = 'moderate';
    } else if (peakCorrelation >= 0.25 || metrics.rms >= 0.005) {
      rawQuality = 'weak';
    } else {
      rawQuality = 'unusable';
    }

    this.updateQualityState(rawQuality);
    return this.currentQuality;
  }

  private updateQualityState(candidate: SignalQualityLevel): void {
    if (candidate === this.currentQuality) {
      this.qualityStreak = 0;
      this.targetQuality = candidate;
      return;
    }

    if (candidate === this.targetQuality) {
      this.qualityStreak++;
      // Require 2 consecutive frames to transition
      if (this.qualityStreak >= 2) {
        this.currentQuality = candidate;
        this.qualityStreak = 0;
      }
    } else {
      this.targetQuality = candidate;
      this.qualityStreak = 1;
    }
  }

  public reset(): void {
    this.currentQuality = 'unusable';
    this.targetQuality = 'unusable';
    this.qualityStreak = 0;
  }
}
