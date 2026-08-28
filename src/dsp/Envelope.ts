/**
 * Doppler Audio Envelope Follower
 * Rectifies the audio signal and applies an asymmetric attack/decay filter
 * to track the rhythmic cardiac pulsatile envelope of fetal heart beats.
 */
export class EnvelopeFollower {
  private attackCoeff: number = 0;
  private decayCoeff: number = 0;
  private envelope = 0;
  private sampleRate: number;
  private attackMs: number;
  private decayMs: number;

  constructor(attackMs = 15, decayMs = 65, sampleRate = 44100) {
    this.sampleRate = sampleRate;
    this.attackMs = attackMs;
    this.decayMs = decayMs;
    this.updateCoefficients();
  }

  public setTiming(attackMs: number, decayMs: number, sampleRate = this.sampleRate): void {
    this.attackMs = attackMs;
    this.decayMs = decayMs;
    this.sampleRate = sampleRate;
    this.updateCoefficients();
  }

  private updateCoefficients(): void {
    const attackSamples = Math.max(1, (this.attackMs / 1000) * this.sampleRate);
    const decaySamples = Math.max(1, (this.decayMs / 1000) * this.sampleRate);

    this.attackCoeff = Math.exp(-1 / attackSamples);
    this.decayCoeff = Math.exp(-1 / decaySamples);
  }

  public processSample(x: number): number {
    const rectified = Math.abs(x);
    if (rectified > this.envelope) {
      this.envelope = (1 - this.attackCoeff) * rectified + this.attackCoeff * this.envelope;
    } else {
      this.envelope = (1 - this.decayCoeff) * rectified + this.decayCoeff * this.envelope;
    }
    return this.envelope;
  }

  public process(input: Float32Array, output?: Float32Array): Float32Array {
    const out = output || new Float32Array(input.length);
    for (let i = 0; i < input.length; i++) {
      out[i] = this.processSample(input[i]);
    }
    return out;
  }

  public reset(): void {
    this.envelope = 0;
  }
}
