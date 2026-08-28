/**
 * DopplerCaptureProcessor Source Code
 * AudioWorkletProcessor executing on the Web Audio rendering thread.
 * Bundles 128-sample blocks into chunks and posts them via message port.
 */
export const DOPPLER_WORKLET_CODE = `
class DopplerCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 512;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.sequence = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0) {
      return true;
    }

    const channelData = input[0]; // Channel 0 (Mono/Left)
    const len = channelData.length;

    for (let i = 0; i < len; i++) {
      this.buffer[this.bufferIndex++] = channelData[i];

      if (this.bufferIndex >= this.bufferSize) {
        // Post full chunk to main thread
        const chunk = new Float32Array(this.buffer);
        this.port.postMessage({
          type: 'pcm_chunk',
          sequence: this.sequence++,
          timestamp: currentTime,
          samples: chunk.buffer
        }, [chunk.buffer]);

        this.buffer = new Float32Array(this.bufferSize);
        this.bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('doppler-capture-processor', DopplerCaptureProcessor);
`;
