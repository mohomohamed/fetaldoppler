/**
 * Transient Spike & Movement Artifact Suppressor
 * Clamps or softly attenuates sharp, short-duration transients (e.g. transducer rubs, cable bumps)
 * using a rolling amplitude tracker with soft-knee limiter.
 */
export class SpikeSuppressor {
  private movingThreshold = 0.1;
  private alpha = 0.005; // smoothing factor for baseline level

  constructor(initialThreshold = 0.2) {
    this.movingThreshold = initialThreshold;
  }

  public processSample(x: number): number {
    const absX = Math.abs(x);
    // Update dynamic rolling threshold
    this.movingThreshold = (1 - this.alpha) * this.movingThreshold + this.alpha * absX;

    const ceiling = Math.max(0.05, this.movingThreshold * 4.5);

    if (absX <= ceiling) {
      return x;
    }

    // Soft saturation curve beyond ceiling
    const sign = x >= 0 ? 1 : -1;
    const excess = absX - ceiling;
    const compressed = ceiling + Math.tanh(excess * 0.5) * (ceiling * 0.5);
    return sign * compressed;
  }

  public process(input: Float32Array, output?: Float32Array): Float32Array {
    const out = output || new Float32Array(input.length);
    for (let i = 0; i < input.length; i++) {
      out[i] = this.processSample(input[i]);
    }
    return out;
  }

  public reset(): void {
    this.movingThreshold = 0.1;
  }
}
