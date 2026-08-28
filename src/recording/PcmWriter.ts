import { WavFinalizer } from './WavFinalizer';

export class PcmWriter {
  private opfsFileHandle: any = null;
  private opfsWritable: any = null;
  private memoryChunks: Float32Array[] = [];
  private totalSampleCount = 0;
  private isOpfsSupported = false;

  constructor() {
    this.isOpfsSupported = typeof navigator !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage;
  }

  public async initSession(sessionId: string): Promise<'opfs' | 'idb'> {
    this.memoryChunks = [];
    this.totalSampleCount = 0;

    if (this.isOpfsSupported) {
      try {
        const root = await navigator.storage.getDirectory();
        const dir = await root.getDirectoryHandle('doppler_recordings', { create: true });
        this.opfsFileHandle = await dir.getFileHandle(`${sessionId}.raw`, { create: true });
        this.opfsWritable = await this.opfsFileHandle.createWritable();
        return 'opfs';
      } catch (err) {
        console.warn('OPFS initialization failed, falling back to memory/IndexedDB:', err);
      }
    }

    return 'idb';
  }

  public async appendChunk(chunk: Float32Array): Promise<void> {
    this.memoryChunks.push(new Float32Array(chunk));
    this.totalSampleCount += chunk.length;

    if (this.opfsWritable) {
      try {
        // Convert Float32 to Int16 PCM bytes
        const int16 = new Int16Array(chunk.length);
        for (let i = 0; i < chunk.length; i++) {
          const s = Math.max(-1, Math.min(1, chunk[i]));
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        await this.opfsWritable.write(int16.buffer);
      } catch (err) {
        console.warn('Failed to stream chunk to OPFS:', err);
      }
    }
  }

  public async finalize(sampleRate: number): Promise<{
    wavBlob: Blob;
    fullSamples: Float32Array;
    totalSamples: number;
    byteLength: number;
  }> {
    if (this.opfsWritable) {
      try {
        await this.opfsWritable.close();
        this.opfsWritable = null;
      } catch (e) {
        console.warn('Error closing OPFS writable:', e);
      }
    }

    // Concatenate all chunks
    const fullSamples = new Float32Array(this.totalSampleCount);
    let offset = 0;
    for (const chunk of this.memoryChunks) {
      fullSamples.set(chunk, offset);
      offset += chunk.length;
    }

    const wavBuffer = WavFinalizer.encodeWav(fullSamples, sampleRate, 1);
    const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });

    return {
      wavBlob,
      fullSamples,
      totalSamples: this.totalSampleCount,
      byteLength: wavBuffer.byteLength,
    };
  }

  public clear(): void {
    this.memoryChunks = [];
    this.totalSampleCount = 0;
    this.opfsWritable = null;
    this.opfsFileHandle = null;
  }
}
