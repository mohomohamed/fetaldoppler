/**
 * DC Blocker Filter
 * Single-pole recursive high-pass filter: y[n] = x[n] - x[n-1] + R * y[n-1]
 * Typically R is ~0.995 to remove DC bias without attenuating low Doppler frequencies (> 20 Hz).
 */
export class DcBlocker {
  private r: number;
  private xPrev = 0;
  private yPrev = 0;

  constructor(poleRadius = 0.995) {
    this.r = poleRadius;
  }

  public processSample(x: number): number {
    const y = x - this.xPrev + this.r * this.yPrev;
    this.xPrev = x;
    this.yPrev = y;
    return y;
  }

  public process(input: Float32Array, output?: Float32Array): Float32Array {
    const out = output || new Float32Array(input.length);
    for (let i = 0; i < input.length; i++) {
      out[i] = this.processSample(input[i]);
    }
    return out;
  }

  public reset(): void {
    this.xPrev = 0;
    this.yPrev = 0;
  }
}
