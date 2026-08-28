/**
 * Circular Ring Buffer for Float32 PCM Audio Samples
 */
export class AudioRingBuffer {
  private buffer: Float32Array;
  private capacity: number;
  private writeIndex = 0;
  private totalWritten = 0;

  constructor(capacity = 44100 * 10) {
    // Default: 10 seconds capacity
    this.capacity = capacity;
    this.buffer = new Float32Array(capacity);
  }

  public write(samples: Float32Array): void {
    const len = samples.length;
    for (let i = 0; i < len; i++) {
      this.buffer[this.writeIndex] = samples[i];
      this.writeIndex = (this.writeIndex + 1) % this.capacity;
    }
    this.totalWritten += len;
  }

  /**
   * Reads the most recent `count` samples in chronological order.
   */
  public readLatest(count: number, output?: Float32Array): Float32Array {
    const n = Math.min(count, this.capacity, this.totalWritten);
    const out = output && output.length >= n ? output : new Float32Array(n);

    const startPos = (this.writeIndex - n + this.capacity) % this.capacity;
    for (let i = 0; i < n; i++) {
      out[i] = this.buffer[(startPos + i) % this.capacity];
    }
    return out;
  }

  public get totalSamples(): number {
    return this.totalWritten;
  }

  public clear(): void {
    this.buffer.fill(0);
    this.writeIndex = 0;
    this.totalWritten = 0;
  }
}
