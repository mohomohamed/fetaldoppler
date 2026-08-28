import { describe, it, expect } from 'vitest';
import { WavFinalizer } from '../recording/WavFinalizer';

describe('WAV Finalizer & Decoder Tests', () => {
  it('encodes and decodes standard 16-bit PCM WAV with high fidelity', () => {
    const sampleRate = 44100;
    const numSamples = 1024;
    const original = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      original[i] = 0.75 * Math.sin((2 * Math.PI * 440 * i) / sampleRate);
    }

    const wavBuffer = WavFinalizer.encodeWav(original, sampleRate, 1);
    expect(wavBuffer.byteLength).toBe(44 + numSamples * 2);

    const { samples: decoded, sampleRate: decodedRate, channels } = WavFinalizer.decodeWav(wavBuffer);
    expect(decodedRate).toBe(sampleRate);
    expect(channels).toBe(1);
    expect(decoded.length).toBe(numSamples);

    // Check quantization error is <= 1/32767 (~0.0001)
    for (let i = 0; i < numSamples; i++) {
      expect(Math.abs(decoded[i] - original[i])).toBeLessThan(0.0002);
    }
  });
});
