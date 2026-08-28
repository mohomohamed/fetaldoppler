/**
 * Biquad IIR Filter (Butterworth Direct Form II Transposed)
 * Provides Low-pass, High-pass, and Band-pass filtering for Doppler audio extraction.
 */

export type FilterType = 'lowpass' | 'highpass' | 'bandpass';

export class BiquadFilter {
  // Coefficients
  private b0 = 1;
  private b1 = 0;
  private b2 = 0;
  private a1 = 0;
  private a2 = 0;

  // State variables (Direct Form II Transposed)
  private z1 = 0;
  private z2 = 0;

  private type: FilterType;
  private cutoffFrequency: number;
  private q: number;
  private sampleRate: number;

  constructor(type: FilterType, cutoffFrequency: number, sampleRate: number, q = 0.7071) {
    this.type = type;
    this.cutoffFrequency = cutoffFrequency;
    this.sampleRate = sampleRate;
    this.q = q;
    this.recompute();
  }

  public setParameters(type: FilterType, cutoffFrequency: number, sampleRate: number, q = 0.7071): void {
    this.type = type;
    this.cutoffFrequency = cutoffFrequency;
    this.sampleRate = sampleRate;
    this.q = q;
    this.recompute();
  }

  private recompute(): void {
    const omega = (2 * Math.PI * Math.min(this.cutoffFrequency, this.sampleRate * 0.49)) / this.sampleRate;
    const sinOmega = Math.sin(omega);
    const cosOmega = Math.cos(omega);
    const alpha = sinOmega / (2 * Math.max(0.01, this.q));

    let a0 = 1;

    switch (this.type) {
      case 'lowpass':
        this.b0 = (1 - cosOmega) / 2;
        this.b1 = 1 - cosOmega;
        this.b2 = (1 - cosOmega) / 2;
        a0 = 1 + alpha;
        this.a1 = -2 * cosOmega;
        this.a2 = 1 - alpha;
        break;

      case 'highpass':
        this.b0 = (1 + cosOmega) / 2;
        this.b1 = -(1 + cosOmega);
        this.b2 = (1 + cosOmega) / 2;
        a0 = 1 + alpha;
        this.a1 = -2 * cosOmega;
        this.a2 = 1 - alpha;
        break;

      case 'bandpass':
        this.b0 = alpha;
        this.b1 = 0;
        this.b2 = -alpha;
        a0 = 1 + alpha;
        this.a1 = -2 * cosOmega;
        this.a2 = 1 - alpha;
        break;
    }

    // Normalize by a0
    this.b0 /= a0;
    this.b1 /= a0;
    this.b2 /= a0;
    this.a1 /= a0;
    this.a2 /= a0;
  }

  public processSample(x: number): number {
    const y = this.b0 * x + this.z1;
    this.z1 = this.b1 * x - this.a1 * y + this.z2;
    this.z2 = this.b2 * x - this.a2 * y;
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
    this.z1 = 0;
    this.z2 = 0;
  }
}

/**
 * Cascaded High-pass + Low-pass Doppler Bandpass Filter
 */
export class DopplerBandpassFilter {
  private hpFilter: BiquadFilter;
  private lpFilter: BiquadFilter;

  constructor(lowCutHz = 60, highCutHz = 1200, sampleRate = 44100) {
    this.hpFilter = new BiquadFilter('highpass', lowCutHz, sampleRate, 0.7071);
    this.lpFilter = new BiquadFilter('lowpass', highCutHz, sampleRate, 0.7071);
  }

  public configure(lowCutHz: number, highCutHz: number, sampleRate: number): void {
    this.hpFilter.setParameters('highpass', lowCutHz, sampleRate, 0.7071);
    this.lpFilter.setParameters('lowpass', highCutHz, sampleRate, 0.7071);
  }

  public processSample(x: number): number {
    const hp = this.hpFilter.processSample(x);
    return this.lpFilter.processSample(hp);
  }

  public process(input: Float32Array, output?: Float32Array): Float32Array {
    const out = output || new Float32Array(input.length);
    for (let i = 0; i < input.length; i++) {
      out[i] = this.processSample(input[i]);
    }
    return out;
  }

  public reset(): void {
    this.hpFilter.reset();
    this.lpFilter.reset();
  }
}
