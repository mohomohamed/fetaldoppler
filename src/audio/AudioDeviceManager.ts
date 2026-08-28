import { DiscoveredAudioDevice, AudioInputType } from '../domain/types';

export class AudioDeviceManager {
  private onDeviceChangeCallback?: (devices: DiscoveredAudioDevice[]) => void;

  constructor() {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.ondevicechange = () => {
        this.enumerateDevices().then((devices) => {
          if (this.onDeviceChangeCallback) {
            this.onDeviceChangeCallback(devices);
          }
        });
      };
    }
  }

  public setOnDeviceChange(cb: (devices: DiscoveredAudioDevice[]) => void): void {
    this.onDeviceChangeCallback = cb;
  }

  /**
   * Request initial microphone permission to reveal device labels.
   */
  public async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      console.warn('Audio permission denied or failed:', err);
      return false;
    }
  }

  /**
   * Enumerate all audio input devices and classify their types.
   */
  public async enumerateDevices(): Promise<DiscoveredAudioDevice[]> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');

      return audioInputs.map((d) => {
        const label = d.label || `Audio Input (${d.deviceId.slice(0, 5)})`;
        const type = this.classifyDeviceType(label);
        const isPreferred = type === 'usb';

        return {
          deviceId: d.deviceId,
          label,
          groupId: d.groupId,
          type,
          isPreferred,
        };
      });
    } catch (err) {
      console.error('Failed to enumerate audio devices:', err);
      return [];
    }
  }

  private classifyDeviceType(label: string): AudioInputType {
    const l = label.toLowerCase();
    if (l.includes('usb') || l.includes('interface') || l.includes('line in')) {
      return 'usb';
    }
    if (l.includes('headset') || l.includes('wired') || l.includes('3.5')) {
      return 'headset';
    }
    if (l.includes('bluetooth') || l.includes('airpods') || l.includes('bt')) {
      return 'bluetooth';
    }
    if (l.includes('built-in') || l.includes('internal') || l.includes('microphone') || l.includes('default')) {
      return 'built-in';
    }
    return 'unknown';
  }
}
