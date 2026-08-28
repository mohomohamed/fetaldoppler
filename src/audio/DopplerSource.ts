import { AudioCaptureEngine } from './AudioCaptureEngine';
import { VerifiedTrackSettings } from '../domain/types';

export type AudioChunkCallback = (chunk: Float32Array, sequence: number, timestamp: number) => void;

export interface DopplerSource {
  readonly id: string;
  readonly name: string;
  readonly sampleRate: number;
  readonly isLive: boolean;
  start(callback: AudioChunkCallback): Promise<VerifiedTrackSettings | null>;
  stop(): Promise<void>;
}

/**
 * Live Web Audio Source
 */
export class LiveMediaStreamSource implements DopplerSource {
  public readonly id = 'live';
  public readonly name = 'Live USB / Audio Interface';
  public readonly isLive = true;

  private captureEngine: AudioCaptureEngine;
  private unsubscribe?: () => void;
  private requestedDeviceId?: string;

  constructor(deviceId?: string) {
    this.requestedDeviceId = deviceId;
    this.captureEngine = new AudioCaptureEngine();
  }

  public get sampleRate(): number {
    return this.captureEngine.sampleRate;
  }

  public setDeviceId(deviceId?: string): void {
    this.requestedDeviceId = deviceId;
  }

  public async start(callback: AudioChunkCallback): Promise<VerifiedTrackSettings> {
    const verified = await this.captureEngine.start(this.requestedDeviceId);
    this.unsubscribe = this.captureEngine.subscribeChunks(callback);
    return verified;
  }

  public async stop(): Promise<void> {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
    await this.captureEngine.stop();
  }
}

/**
 * Simulated Doppler Heart Sound Source (Demo Mode)
 */
export class SimulatedDemoSource implements DopplerSource {
  public readonly id = 'simulated';
  public readonly name = 'Simulated Doppler Source (Demo Mode)';
  public readonly isLive = false;
  public readonly sampleRate = 44100;

  private targetBpm = 140;
  private intervalId: any = null;
  private sequence = 0;
  private phase = 0;

  constructor(targetBpm = 140) {
    this.targetBpm = targetBpm;
  }

  public setBpm(bpm: number): void {
    this.targetBpm = Math.max(50, Math.min(240, bpm));
  }

  public async start(callback: AudioChunkCallback): Promise<VerifiedTrackSettings> {
    this.sequence = 0;
    this.phase = 0;
    const chunkSize = 512;
    const chunkIntervalMs = (chunkSize / this.sampleRate) * 1000;

    this.intervalId = setInterval(() => {
      const chunk = new Float32Array(chunkSize);
      const beatPeriodSamples = Math.floor((60 / this.targetBpm) * this.sampleRate);

      for (let i = 0; i < chunkSize; i++) {
        const currentSample = this.phase + i;
        const beatPos = (currentSample % beatPeriodSamples) / this.sampleRate;

        let env = 0;
        if (beatPos < 0.08) {
          env = Math.sin((beatPos / 0.08) * Math.PI);
        } else if (beatPos > 0.12 && beatPos < 0.18) {
          env = 0.5 * Math.sin(((beatPos - 0.12) / 0.06) * Math.PI);
        }

        const carrier = Math.sin(2 * Math.PI * 320 * (currentSample / this.sampleRate));
        const noise = (Math.random() - 0.5) * 0.04;
        chunk[i] = (carrier * env + noise) * 0.45;
      }

      this.phase += chunkSize;
      callback(chunk, this.sequence++, Date.now() / 1000);
    }, chunkIntervalMs);

    return {
      deviceId: 'simulated-demo-device',
      sampleRate: this.sampleRate,
      channelCount: 1,
      echoCancellation: false,
      autoGainControl: false,
      noiseSuppression: false,
      isExternalInput: true,
      warnings: ['DEMO MODE ACTIVE: Audio is synthetically generated for testing.'],
    };
  }

  public async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
