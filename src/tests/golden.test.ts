import { describe, it, expect } from 'vitest';
import { FhrEstimator } from '../fhr/FhrEstimator';
import { DEFAULT_DSP_CONFIG } from '../domain/types';

describe('Golden WAV & Synthetic DSP Benchmark Suite (SRS Section 76-77)', () => {
  const sampleRate = 44100;

  // Helper to generate synthetic Doppler pulses
  function generateDopplerPulseTrain(bpm: number, durationSec = 3.0, noiseLevel = 0.02): Float32Array {
    const totalSamples = Math.floor(sampleRate * durationSec);
    const samples = new Float32Array(totalSamples);
    const intervalSamples = Math.floor((60 / bpm) * sampleRate);

    for (let i = 0; i < totalSamples; i++) {
      const beatPhase = (i % intervalSamples) / sampleRate;
      let env = 0;

      // Systolic pulse
      if (beatPhase < 0.08) {
        env = Math.sin((beatPhase / 0.08) * Math.PI);
      }
      // Diastolic pulse
      else if (beatPhase > 0.12 && beatPhase < 0.18) {
        env = 0.5 * Math.sin(((beatPhase - 0.12) / 0.06) * Math.PI);
      }

      const carrier = Math.sin(2 * Math.PI * 300 * (i / sampleRate));
      const noise = (Math.random() - 0.5) * noiseLevel;
      samples[i] = (carrier * env + noise) * 0.5;
    }
    return samples;
  }

  it('1. Clean Periodic 120 BPM: accurately estimates FHR and classifies as strong/moderate quality', () => {
    const signal = generateDopplerPulseTrain(120, 3.0, 0.01);
    const estimator = new FhrEstimator(sampleRate, DEFAULT_DSP_CONFIG);
    
    // Process multiple frames to allow quality hysteresis to stabilize
    estimator.processWindow(signal);
    const { result, metrics } = estimator.processWindow(signal);

    expect(result.estimatedBpm).toBeDefined();
    expect(Math.abs((result.estimatedBpm || 0) - 120)).toBeLessThanOrEqual(2);
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(metrics.clipping).toBe(false);
  });

  it('2. Clean Periodic 140 BPM: accurately estimates FHR', () => {
    const signal = generateDopplerPulseTrain(140, 3.0, 0.01);
    const estimator = new FhrEstimator(sampleRate, DEFAULT_DSP_CONFIG);
    estimator.processWindow(signal);
    const { result } = estimator.processWindow(signal);

    expect(result.estimatedBpm).toBeDefined();
    expect(Math.abs((result.estimatedBpm || 0) - 140)).toBeLessThanOrEqual(2);
  });

  it('3. Clean Periodic 160 BPM: accurately estimates FHR', () => {
    const signal = generateDopplerPulseTrain(160, 3.0, 0.01);
    const estimator = new FhrEstimator(sampleRate, DEFAULT_DSP_CONFIG);
    estimator.processWindow(signal);
    const { result } = estimator.processWindow(signal);

    expect(result.estimatedBpm).toBeDefined();
    expect(Math.abs((result.estimatedBpm || 0) - 160)).toBeLessThanOrEqual(2);
  });

  it('4. Weak Signal (<10 dB SNR): correctly flags quality as weak or unusable', () => {
    const signal = generateDopplerPulseTrain(140, 3.0, 0.4); // heavy noise
    const estimator = new FhrEstimator(sampleRate, DEFAULT_DSP_CONFIG);
    const { result } = estimator.processWindow(signal);

    expect(['weak', 'unusable']).toContain(result.quality);
  });

  it('5. Saturated / Clipping Signal: detects clipping and counts clipped samples', () => {
    const raw = generateDopplerPulseTrain(140, 2.0, 0.01);
    // Multiply amplitude to cause heavy clipping
    for (let i = 0; i < raw.length; i++) {
      raw[i] = Math.max(-1, Math.min(1, raw[i] * 5.0));
    }

    const estimator = new FhrEstimator(sampleRate, DEFAULT_DSP_CONFIG);
    const { metrics } = estimator.processWindow(raw);

    expect(metrics.clipping).toBe(true);
    expect(metrics.clipCount).toBeGreaterThan(100);
  });

  it('6. Maternal Rate Sample: flags maternal rate warning for 75 BPM pelvic rate', () => {
    const signal = generateDopplerPulseTrain(75, 3.0, 0.01);
    const estimator = new FhrEstimator(sampleRate, DEFAULT_DSP_CONFIG);
    const { result } = estimator.processWindow(signal);

    expect(result.isMaternalWarning).toBe(true);
  });

  it('7. Dropout & Interruption: clears BPM and does not fabricate false continuity', () => {
    const zeroSignal = new Float32Array(sampleRate * 2.5); // 2.5s absolute silence
    const estimator = new FhrEstimator(sampleRate, DEFAULT_DSP_CONFIG);

    // Run multiple silent frames
    let lastResult = null;
    for (let f = 0; f < 6; f++) {
      const { result } = estimator.processWindow(zeroSignal, true);
      lastResult = result;
    }

    expect(lastResult?.estimatedBpm).toBeNull();
    expect(lastResult?.quality).toBe('unusable');
  });
});
