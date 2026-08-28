import { VerifiedTrackSettings } from '../domain/types';
import { AudioTrackVerifier } from './AudioTrackVerifier';
import { DOPPLER_WORKLET_CODE } from '../worklets/DopplerCaptureProcessor';

export type AudioChunkHandler = (chunk: Float32Array, sequence: number, timestamp: number) => void;

export class AudioCaptureEngine {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private wakeLock: any = null;

  private isRunning = false;
  private verifiedSettings: VerifiedTrackSettings | null = null;
  private chunkSubscribers: Set<AudioChunkHandler> = new Set();

  public subscribeChunks(handler: AudioChunkHandler): () => void {
    this.chunkSubscribers.add(handler);
    return () => this.chunkSubscribers.delete(handler);
  }

  public get activeSettings(): VerifiedTrackSettings | null {
    return this.verifiedSettings;
  }

  public get sampleRate(): number {
    return this.audioContext?.sampleRate || 44100;
  }

  public get capturing(): boolean {
    return this.isRunning;
  }

  /**
   * Start audio capture from the requested device ID.
   */
  public async start(deviceId?: string): Promise<VerifiedTrackSettings> {
    if (this.isRunning) {
      await this.stop();
    }

    // 1. Initialize AudioContext
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioCtx({ latencyHint: 'interactive' });
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // 2. Request UserMedia stream with raw constraints
    const constraints: MediaStreamConstraints = {
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: { exact: false },
        noiseSuppression: { exact: false },
        autoGainControl: { exact: false },
        channelCount: 1,
      },
      video: false,
    };

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      // If exact constraint failed, retry with ideal/flexible constraints
      console.warn('Exact constraints rejected, falling back to non-exact constraints', e);
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });
    }

    const audioTrack = this.mediaStream.getAudioTracks()[0];
    if (!audioTrack) {
      throw new Error('No audio track received from media stream.');
    }

    // 3. Verify settings
    this.verifiedSettings = AudioTrackVerifier.verify(audioTrack, deviceId);

    // 4. Load AudioWorklet from Blob URL
    const blob = new Blob([DOPPLER_WORKLET_CODE], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(blob);
    await this.audioContext.audioWorklet.addModule(workletUrl);
    URL.revokeObjectURL(workletUrl);

    // 5. Connect Web Audio graph
    const sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.workletNode = new AudioWorkletNode(this.audioContext, 'doppler-capture-processor');

    this.workletNode.port.onmessage = (event) => {
      if (event.data.type === 'pcm_chunk') {
        const chunk = new Float32Array(event.data.samples);
        for (const handler of this.chunkSubscribers) {
          handler(chunk, event.data.sequence, event.data.timestamp);
        }
      }
    };

    sourceNode.connect(this.workletNode);
    // Note: Do not connect to destination to avoid acoustic feedback loops

    // 6. Request Screen Wake Lock
    this.acquireWakeLock();

    this.isRunning = true;
    return this.verifiedSettings;
  }

  public async stop(): Promise<void> {
    this.isRunning = false;

    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode.port.onmessage = null;
      this.workletNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.releaseWakeLock();
  }

  private async acquireWakeLock(): Promise<void> {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await (navigator as any).wakeLock.request('screen');
      } catch (err) {
        console.warn('Could not acquire Screen Wake Lock:', err);
      }
    }
  }

  private releaseWakeLock(): void {
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
  }
}
