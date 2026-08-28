import { describe, it, expect } from 'vitest';
import { AudioRingBuffer } from '../audio/AudioRingBuffer';

describe('AudioRingBuffer Tests', () => {
  it('writes and reads back sequential audio samples correctly', () => {
    const ring = new AudioRingBuffer(100);
    const chunk1 = new Float32Array([1, 2, 3, 4, 5]);
    ring.write(chunk1);

    const read = ring.readLatest(5);
    expect(Array.from(read)).toEqual([1, 2, 3, 4, 5]);
  });

  it('wraps around circular buffer accurately on overflow', () => {
    const ring = new AudioRingBuffer(10);
    // Write 12 samples (overflows capacity of 10 by 2)
    const samples = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    ring.write(samples);

    const latest = ring.readLatest(5);
    expect(Array.from(latest)).toEqual([8, 9, 10, 11, 12]);
  });
});
