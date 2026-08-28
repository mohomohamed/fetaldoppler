import { FastFourierTransform } from './Fft';

export class SpectrogramEngine {
  private fft: FastFourierTransform;
  private fftSize: number;
  private hopSize: number;
  private sampleRate: number;
  private realBuffer: Float32Array;
  private imagBuffer: Float32Array;

  constructor(fftSize = 512, hopSize = 256, sampleRate = 44100) {
    this.fftSize = fftSize;
    this.hopSize = hopSize;
    this.sampleRate = sampleRate;
    this.fft = new FastFourierTransform(fftSize);
    this.realBuffer = new Float32Array(fftSize);
    this.imagBuffer = new Float32Array(fftSize);
  }

  public get frequencyBinCount(): number {
    return this.fftSize / 2;
  }

  public get binResolutionHz(): number {
    return this.sampleRate / this.fftSize;
  }

  /**
   * Process a chunk of audio samples and compute magnitude frames
   */
  public computeFrames(samples: Float32Array): Float32Array[] {
    const frames: Float32Array[] = [];
    const len = samples.length;

    for (let offset = 0; offset + this.fftSize <= len; offset += this.hopSize) {
      this.realBuffer.set(samples.subarray(offset, offset + this.fftSize));
      this.fft.transform(this.realBuffer, this.imagBuffer);

      const magDb = this.fft.getMagnitudeDb(this.realBuffer, this.imagBuffer);
      frames.push(new Float32Array(magDb));
    }

    return frames;
  }

  public computeSingleFrame(samples: Float32Array, output?: Float32Array): Float32Array {
    if (samples.length >= this.fftSize) {
      this.realBuffer.set(samples.subarray(samples.length - this.fftSize));
    } else {
      this.realBuffer.fill(0);
      this.realBuffer.set(samples, this.fftSize - samples.length);
    }

    this.fft.transform(this.realBuffer, this.imagBuffer);
    return this.fft.getMagnitudeDb(this.realBuffer, this.imagBuffer, output);
  }
}
