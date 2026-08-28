/**
 * Normalized Autocorrelation Function (NACF) Engine
 * Identifies periodic cardiac cycles in the Doppler envelope within the physiological range (50 - 240 BPM).
 * Includes automatic decimation for real-time sub-millisecond execution and fundamental period preference.
 */

export interface AutocorrelationPeak {
  bpm: number;
  lagSamples: number;
  coefficient: number; // 0.0 to 1.0
}

export class AutocorrelationEngine {
  /**
   * Compute normalized autocorrelation with automatic decimation and fundamental period selection.
   */
  public static compute(
    signal: Float32Array,
    minBpm: number,
    maxBpm: number,
    sampleRate: number
  ): { lags: Int32Array; nacf: Float32Array; peaks: AutocorrelationPeak[] } {
    const rawN = signal.length;
    if (rawN === 0) {
      return { lags: new Int32Array(0), nacf: new Float32Array(0), peaks: [] };
    }

    // Decimate to ~1000 Hz for high performance (cardiac envelope max frequency is < 20 Hz)
    const targetRate = 1000;
    const decimateFactor = sampleRate > 2000 ? Math.floor(sampleRate / targetRate) : 1;
    const effSampleRate = sampleRate / decimateFactor;
    const N = Math.floor(rawN / decimateFactor);

    if (N < 50) {
      return { lags: new Int32Array(0), nacf: new Float32Array(0), peaks: [] };
    }

    // Downsample and compute mean
    const zeroMean = new Float32Array(N);
    let mean = 0;
    for (let i = 0; i < N; i++) {
      const val = signal[i * decimateFactor];
      zeroMean[i] = val;
      mean += val;
    }
    mean /= N;

    for (let i = 0; i < N; i++) {
      zeroMean[i] -= mean;
    }

    // Convert BPM bounds to lag sample bounds
    const minLag = Math.max(1, Math.floor((60 / maxBpm) * effSampleRate));
    const maxLag = Math.min(N - 2, Math.ceil((60 / minBpm) * effSampleRate));

    if (minLag >= maxLag || maxLag >= N) {
      return { lags: new Int32Array(0), nacf: new Float32Array(0), peaks: [] };
    }

    const numLags = maxLag - minLag + 1;
    const lags = new Int32Array(numLags);
    const nacf = new Float32Array(numLags);

    // Compute energy of reference window
    for (let k = 0; k < numLags; k++) {
      const lag = minLag + k;
      lags[k] = lag;

      let crossSum = 0;
      let energy0 = 0;
      let energyLag = 0;

      const limit = N - lag;
      for (let n = 0; n < limit; n++) {
        const s0 = zeroMean[n];
        const sLag = zeroMean[n + lag];
        crossSum += s0 * sLag;
        energy0 += s0 * s0;
        energyLag += sLag * sLag;
      }

      const denominator = Math.sqrt(energy0 * energyLag);
      nacf[k] = denominator > 1e-9 ? Math.max(-1, Math.min(1, crossSum / denominator)) : 0;
    }

    // Peak picking in chronological lag order (from shortest lag / highest BPM to longest lag)
    const rawPeaks: AutocorrelationPeak[] = [];
    for (let k = 1; k < numLags - 1; k++) {
      if (nacf[k] > nacf[k - 1] && nacf[k] > nacf[k + 1] && nacf[k] > 0.15) {
        // Parabolic interpolation for sub-sample lag accuracy
        const y0 = nacf[k - 1];
        const y1 = nacf[k];
        const y2 = nacf[k + 1];
        const denom = y0 - 2 * y1 + y2;
        const delta = denom !== 0 ? (0.5 * (y0 - y2)) / denom : 0;
        const trueLag = lags[k] + delta;
        const peakVal = y1 - 0.25 * (y0 - y2) * delta;

        const bpm = (60 * effSampleRate) / trueLag;
        if (bpm >= minBpm && bpm <= maxBpm) {
          rawPeaks.push({
            bpm,
            lagSamples: trueLag * decimateFactor,
            coefficient: Math.max(0, Math.min(1, peakVal)),
          });
        }
      }
    }

    // Fundamental Period Resolution:
    // If an earlier peak (lower lag = higher BPM) has a coefficient >= 75% of a later peak (double lag = half BPM),
    // give the fundamental earlier peak priority.
    const peaks = [...rawPeaks];
    peaks.sort((a, b) => {
      // Check if one is approximately double the period (half BPM) of the other
      const ratio = b.lagSamples / a.lagSamples;
      if (ratio >= 1.8 && ratio <= 2.2 && a.coefficient >= b.coefficient * 0.75) {
        return -1; // Prefer a (fundamental)
      }
      const invRatio = a.lagSamples / b.lagSamples;
      if (invRatio >= 1.8 && invRatio <= 2.2 && b.coefficient >= a.coefficient * 0.75) {
        return 1; // Prefer b (fundamental)
      }
      return b.coefficient - a.coefficient;
    });

    return { lags, nacf, peaks };
  }
}
