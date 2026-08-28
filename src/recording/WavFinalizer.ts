/**
 * Canonical 16-bit Linear PCM WAV File Encoder
 */
export class WavFinalizer {
  /**
   * Encodes Float32Array PCM samples into a standard RIFF/WAVE ArrayBuffer.
   */
  public static encodeWav(samples: Float32Array, sampleRate: number, numChannels = 1): ArrayBuffer {
    const numSamples = samples.length;
    const bytesPerSample = 2; // 16-bit
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // 1. RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true); // ChunkSize
    this.writeString(view, 8, 'WAVE');

    // 2. "fmt " sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);           // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true);            // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);  // NumChannels
    view.setUint32(24, sampleRate, true);   // SampleRate
    view.setUint32(28, byteRate, true);     // ByteRate
    view.setUint16(32, blockAlign, true);   // BlockAlign
    view.setUint16(34, 16, true);           // BitsPerSample

    // 3. "data" sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);     // Subchunk2Size

    // 4. Write 16-bit clamped samples
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }

    return buffer;
  }

  /**
   * Decode a standard WAV ArrayBuffer back into Float32Array PCM samples and sampleRate.
   */
  public static decodeWav(buffer: ArrayBuffer): { samples: Float32Array; sampleRate: number; channels: number } {
    const view = new DataView(buffer);
    const riff = this.readString(view, 0, 4);
    const wave = this.readString(view, 8, 4);
    if (riff !== 'RIFF' || wave !== 'WAVE') {
      throw new Error('Invalid WAV file format.');
    }

    let offset = 12;
    let sampleRate = 44100;
    let channels = 1;
    let bitsPerSample = 16;
    let dataOffset = 44;
    let dataSize = 0;

    while (offset < view.byteLength) {
      const chunkId = this.readString(view, offset, 4);
      const chunkSize = view.getUint32(offset + 4, true);

      if (chunkId === 'fmt ') {
        channels = view.getUint16(offset + 10, true);
        sampleRate = view.getUint32(offset + 12, true);
        bitsPerSample = view.getUint16(offset + 22, true);
      } else if (chunkId === 'data') {
        dataOffset = offset + 8;
        dataSize = chunkSize;
        break;
      }
      offset += 8 + chunkSize;
    }

    const numSamples = dataSize / (bitsPerSample / 8);
    const samples = new Float32Array(numSamples);

    if (bitsPerSample === 16) {
      for (let i = 0; i < numSamples; i++) {
        const int16 = view.getInt16(dataOffset + i * 2, true);
        samples[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7fff;
      }
    } else if (bitsPerSample === 32) {
      for (let i = 0; i < numSamples; i++) {
        samples[i] = view.getFloat32(dataOffset + i * 4, true);
      }
    }

    return { samples, sampleRate, channels };
  }

  private static writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  private static readString(view: DataView, offset: number, length: number): string {
    let str = '';
    for (let i = 0; i < length; i++) {
      str += String.fromCharCode(view.getUint8(offset + i));
    }
    return str;
  }
}
