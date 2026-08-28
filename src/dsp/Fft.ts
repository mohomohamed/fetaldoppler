/**
 * Radix-2 Cooley-Tukey In-Place Fast Fourier Transform (FFT)
 */
export class FastFourierTransform {
  public readonly size: number;
  private readonly cosTable: Float32Array;
  private readonly sinTable: Float32Array;
  private readonly bitReverse: Uint32Array;
  private readonly window: Float32Array;

  constructor(size = 512) {
    if ((size & (size - 1)) !== 0) {
      throw new Error(`FFT size must be a power of 2, received ${size}`);
    }
    this.size = size;
    const half = size / 2;

    this.cosTable = new Float32Array(half);
    this.sinTable = new Float32Array(half);
    for (let i = 0; i < half; i++) {
      const angle = (-2 * Math.PI * i) / size;
      this.cosTable[i] = Math.cos(angle);
      this.sinTable[i] = Math.sin(angle);
    }

    // Precalculate bit-reversal table
    this.bitReverse = new Uint32Array(size);
    const bits = Math.log2(size);
    for (let i = 0; i < size; i++) {
      let rev = 0;
      let temp = i;
      for (let b = 0; b < bits; b++) {
        rev = (rev << 1) | (temp & 1);
        temp >>= 1;
      }
      this.bitReverse[i] = rev;
    }

    // Precalculate Hann Window
    this.window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      this.window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
    }
  }

  /**
   * Forward FFT: Converts time-domain signal into real and imaginary frequency bins.
   */
  public transform(real: Float32Array, imag: Float32Array): void {
    const N = this.size;

    // Apply Hann window and bit-reversal reordering
    const tempReal = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      tempReal[this.bitReverse[i]] = real[i] * this.window[i];
    }
    real.set(tempReal);
    imag.fill(0);

    // Cooley-Tukey decimation-in-time
    for (let len = 2; len <= N; len <<= 1) {
      const halfLen = len >> 1;
      const step = N / len;

      for (let i = 0; i < N; i += len) {
        for (let j = 0; j < halfLen; j++) {
          const k = j * step;
          const uReal = real[i + j];
          const uImag = imag[i + j];

          const vReal = real[i + j + halfLen] * this.cosTable[k] - imag[i + j + halfLen] * this.sinTable[k];
          const vImag = real[i + j + halfLen] * this.sinTable[k] + imag[i + j + halfLen] * this.cosTable[k];

          real[i + j] = uReal + vReal;
          imag[i + j] = uImag + vImag;
          real[i + j + halfLen] = uReal - vReal;
          imag[i + j + halfLen] = uImag - vImag;
        }
      }
    }
  }

  /**
   * Compute normalized magnitude spectrum in dBFS (-100 dB to 0 dB)
   */
  public getMagnitudeDb(real: Float32Array, imag: Float32Array, output?: Float32Array): Float32Array {
    const half = this.size / 2;
    const out = output || new Float32Array(half);
    const norm = 2 / this.size;

    for (let i = 0; i < half; i++) {
      const mag = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]) * norm;
      const db = 20 * Math.log10(Math.max(1e-5, mag));
      out[i] = Math.max(-100, Math.min(0, db));
    }
    return out;
  }
}
