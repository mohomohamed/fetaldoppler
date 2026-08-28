import { AutocorrelationPeak } from '../dsp/Autocorrelation';

/**
 * Maternal Rate Guard
 * Detects whether the predominant Doppler audio signal is picking up maternal pelvic vessels
 * (typically 60 - 95 BPM) rather than the fetal heart (typically 110 - 160 BPM).
 */
export class MaternalGuard {
  /**
   * Evaluates if a detected rate is likely maternal vessel contamination.
   */
  public static check(
    resolvedBpm: number,
    peaks: AutocorrelationPeak[]
  ): { isMaternalWarning: boolean; alternativeFetalBpm: number | null } {
    // Maternal range: 50 to 95 BPM
    if (resolvedBpm >= 50 && resolvedBpm <= 95) {
      // Check if there is a secondary candidate in the physiological fetal range (110 - 165 BPM)
      for (const p of peaks) {
        if (p.bpm >= 110 && p.bpm <= 165 && p.coefficient > 0.3) {
          return {
            isMaternalWarning: true,
            alternativeFetalBpm: p.bpm,
          };
        }
      }
      return {
        isMaternalWarning: true,
        alternativeFetalBpm: null,
      };
    }

    return {
      isMaternalWarning: false,
      alternativeFetalBpm: null,
    };
  }
}
