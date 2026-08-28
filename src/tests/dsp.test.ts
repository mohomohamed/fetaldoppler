import { describe, it, expect } from 'vitest';
import { DcBlocker } from '../dsp/DcBlocker';
import { DopplerBandpassFilter } from '../dsp/Filters';
import { AutocorrelationEngine } from '../dsp/Autocorrelation';
import { HarmonicGuard } from '../fhr/HarmonicGuard';

describe('DSP Pipeline Unit Tests', () => {
  it('DcBlocker removes DC offset from audio signal', () => {
    const dcBlocker = new DcBlocker(0.995);
    const N = 1000;
    const input = new Float32Array(N);

    // Constant DC bias of +0.8 plus a zero-mean sinusoid
    for (let i = 0; i < N; i++) {
      input[i] = 0.8 + 0.1 * Math.sin((2 * Math.PI * 100 * i) / 44100);
    }

    const output = dcBlocker.process(input);

    // Tail of output should have DC bias removed (approaching ~0 mean)
    let tailSum = 0;
    for (let i = 500; i < N; i++) {
      tailSum += output[i];
    }
    const tailMean = tailSum / 500;

    expect(Math.abs(tailMean)).toBeLessThan(0.05);
  });

  it('DopplerBandpassFilter attenuates out-of-band noise', () => {
    const filter = new DopplerBandpassFilter(60, 1200, 44100);

    // 10 Hz sub-bass (out of band)
    let maxSubBass = 0;
    for (let i = 0; i < 2000; i++) {
      const s = Math.sin((2 * Math.PI * 10 * i) / 44100);
      const out = filter.processSample(s);
      if (i > 500) maxSubBass = Math.max(maxSubBass, Math.abs(out));
    }

    filter.reset();

    // 300 Hz Doppler heart tone (in passband)
    let maxPassband = 0;
    for (let i = 0; i < 2000; i++) {
      const s = Math.sin((2 * Math.PI * 300 * i) / 44100);
      const out = filter.processSample(s);
      if (i > 500) maxPassband = Math.max(maxPassband, Math.abs(out));
    }

    expect(maxSubBass).toBeLessThan(maxPassband * 0.3);
  });

  it('AutocorrelationEngine accurately estimates 140 BPM synthetic pulse train', () => {
    const sampleRate = 44100;
    const duration = 2.5; // seconds
    const totalSamples = Math.floor(sampleRate * duration);
    const targetBpm = 140;
    const intervalSamples = Math.floor((60 / targetBpm) * sampleRate);

    const envelope = new Float32Array(totalSamples);

    for (let i = 0; i < totalSamples; i++) {
      const phase = (i % intervalSamples) / sampleRate;
      if (phase < 0.08) {
        envelope[i] = Math.sin((phase / 0.08) * Math.PI);
      }
    }

    const { peaks } = AutocorrelationEngine.compute(envelope, 50, 240, sampleRate);
    expect(peaks.length).toBeGreaterThan(0);

    const topPeak = peaks[0];
    expect(Math.abs(topPeak.bpm - targetBpm)).toBeLessThan(1.5);
    expect(topPeak.coefficient).toBeGreaterThan(0.7);
  });

  it('HarmonicGuard corrects pitch doubling artifacts', () => {
    // Simulate top peak detected at 280 BPM with secondary candidate at 140 BPM
    const peaks = [
      { bpm: 280, lagSamples: 200, coefficient: 0.85 },
      { bpm: 140, lagSamples: 400, coefficient: 0.80 },
    ];

    const { resolvedBpm, isHarmonicCorrected } = HarmonicGuard.resolve(peaks, 142);
    expect(isHarmonicCorrected).toBe(true);
    expect(resolvedBpm).toBe(140);
  });
});
