import { VerifiedTrackSettings } from '../domain/types';

export class AudioTrackVerifier {
  /**
   * Inspects active MediaStreamTrack to verify actual browser settings vs requests.
   */
  public static verify(track: MediaStreamTrack, requestedDeviceId?: string): VerifiedTrackSettings {
    const settings = track.getSettings();
    const warnings: string[] = [];

    // Check if device matches requested
    if (requestedDeviceId && settings.deviceId && settings.deviceId !== requestedDeviceId) {
      warnings.push(`Device ID mismatch: requested ${requestedDeviceId}, active ${settings.deviceId}`);
    }

    // Check audio processing constraints
    if (settings.echoCancellation === true) {
      warnings.push('Echo Cancellation is ACTIVE in browser stack (may distort Doppler pulses).');
    }
    if (settings.noiseSuppression === true) {
      warnings.push('Noise Suppression is ACTIVE in browser stack (may attenuate low-amplitude Doppler signals).');
    }
    if (settings.autoGainControl === true) {
      warnings.push('Auto Gain Control (AGC) is ACTIVE (may cause artificial amplitude pumping).');
    }

    const label = track.label.toLowerCase();
    const isExternalInput = 
      label.includes('usb') ||
      label.includes('external') ||
      label.includes('line') ||
      label.includes('headset') ||
      label.includes('interface');

    if (!isExternalInput) {
      warnings.push(`Input track "${track.label}" appears to be an internal microphone rather than a USB audio input.`);
    }

    return {
      deviceId: settings.deviceId,
      sampleRate: settings.sampleRate,
      channelCount: settings.channelCount,
      echoCancellation: settings.echoCancellation,
      autoGainControl: settings.autoGainControl,
      noiseSuppression: settings.noiseSuppression,
      latency: (settings as any).latency,
      isExternalInput,
      warnings,
    };
  }
}
