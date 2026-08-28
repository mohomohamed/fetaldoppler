import { AutocorrelationPeak } from '../dsp/Autocorrelation';

/**
 * Harmonic & Octave Error Guard
 * Detects and corrects false pitch doubling (2x) and pitch halving (0.5x)
 * which frequently occur in Doppler audio due to biphasic systolic/diastolic flow valves.
 */
export class HarmonicGuard {
  /**
   * Evaluates peaks to select the true fundamental cardiac rate.
   */
  public static resolve(
    peaks: AutocorrelationPeak[],
    previousBpm: number | null
  ): { resolvedBpm: number; isHarmonicCorrected: boolean; confidence: number } {
    if (peaks.length === 0) {
      return { resolvedBpm: 0, isHarmonicCorrected: false, confidence: 0 };
    }

    const top = peaks[0];
    let resolvedBpm = top.bpm;
    let isHarmonicCorrected = false;
    let confidence = top.coefficient;

    // Search for potential half-rate (doubling error) or double-rate (halving error)
    for (let i = 1; i < peaks.length; i++) {
      const candidate = peaks[i];
      const ratio = candidate.bpm / top.bpm;

      // Case 1: Top peak is pitch doubled (e.g. 260 BPM detected when true FHR is 130 BPM)
      // Candidate is ~0.5x of top, with significant correlation (>= 60% of top peak)
      if (Math.abs(ratio - 0.5) < 0.08 && candidate.coefficient >= top.coefficient * 0.6) {
        // If previous BPM was closer to candidate, prefer candidate
        if (previousBpm !== null && Math.abs(previousBpm - candidate.bpm) < Math.abs(previousBpm - top.bpm)) {
          resolvedBpm = candidate.bpm;
          isHarmonicCorrected = true;
          confidence = candidate.coefficient;
          break;
        } else if (top.bpm > 200 && candidate.bpm >= 100 && candidate.bpm <= 180) {
          // Typical physiological FHR is 110-160 BPM, so > 200 BPM with a strong half candidate is very likely doubled
          resolvedBpm = candidate.bpm;
          isHarmonicCorrected = true;
          confidence = candidate.coefficient;
          break;
        }
      }

      // Case 2: Top peak is pitch halved (e.g. 65 BPM detected when true FHR is 130 BPM)
      // Candidate is ~2.0x of top, with significant correlation
      if (Math.abs(ratio - 2.0) < 0.12 && candidate.coefficient >= top.coefficient * 0.7) {
        if (top.bpm < 90 && candidate.bpm >= 110 && candidate.bpm <= 170) {
          resolvedBpm = candidate.bpm;
          isHarmonicCorrected = true;
          confidence = candidate.coefficient;
          break;
        }
      }
    }

    return { resolvedBpm, isHarmonicCorrected, confidence };
  }
}
