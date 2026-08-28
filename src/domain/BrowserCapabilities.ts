export interface CompatibilityItem {
  name: string;
  supported: boolean;
  critical: boolean;
  details: string;
}

export interface CompatibilityReport {
  isFullyCompatible: boolean;
  items: CompatibilityItem[];
}

export class BrowserCapabilities {
  public static async check(): Promise<CompatibilityReport> {
    const isSecureContext = typeof window !== 'undefined' && window.isSecureContext;
    const hasMediaDevices = typeof navigator !== 'undefined' && !!navigator.mediaDevices;
    const hasGetUserMedia = hasMediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function';
    const hasEnumerateDevices = hasMediaDevices && typeof navigator.mediaDevices.enumerateDevices === 'function';

    const AudioCtx = typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext);
    const hasAudioContext = !!AudioCtx;

    let hasAudioWorklet = false;
    if (hasAudioContext) {
      try {
        const testCtx = new AudioCtx();
        hasAudioWorklet = typeof testCtx.audioWorklet !== 'undefined' && typeof testCtx.audioWorklet.addModule === 'function';
        testCtx.close().catch(() => {});
      } catch (e) {
        hasAudioWorklet = false;
      }
    }

    const hasIndexedDB = typeof window !== 'undefined' && !!window.indexedDB;
    const hasOpfs = typeof navigator !== 'undefined' && 'storage' in navigator && typeof navigator.storage.getDirectory === 'function';
    const hasServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
    const hasWakeLock = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
    const hasStorageEstimate = typeof navigator !== 'undefined' && 'storage' in navigator && typeof navigator.storage.estimate === 'function';

    const items: CompatibilityItem[] = [
      {
        name: 'Secure Context (HTTPS / localhost)',
        supported: isSecureContext,
        critical: true,
        details: isSecureContext ? 'Secure connection verified.' : 'Web Audio & permissions require HTTPS.',
      },
      {
        name: 'Media Devices & getUserMedia',
        supported: hasGetUserMedia,
        critical: true,
        details: hasGetUserMedia ? 'Browser microphone/line-in capture supported.' : 'Audio capture API missing.',
      },
      {
        name: 'Audio Device Enumeration',
        supported: hasEnumerateDevices,
        critical: false,
        details: hasEnumerateDevices ? 'USB audio device selection enabled.' : 'Only default mic available.',
      },
      {
        name: 'Web Audio API (AudioContext)',
        supported: hasAudioContext,
        critical: true,
        details: hasAudioContext ? 'Low-latency audio pipeline active.' : 'Web Audio API missing.',
      },
      {
        name: 'AudioWorklet Threading',
        supported: hasAudioWorklet,
        critical: true,
        details: hasAudioWorklet ? 'Lock-free audio worklet streaming enabled.' : 'AudioWorklet missing (monitoring blocked).',
      },
      {
        name: 'Origin Private File System (OPFS)',
        supported: hasOpfs,
        critical: false,
        details: hasOpfs ? 'High-performance incremental stream-to-disk active.' : 'IndexedDB memory fallback active.',
      },
      {
        name: 'IndexedDB Storage',
        supported: hasIndexedDB,
        critical: true,
        details: hasIndexedDB ? 'Local session database supported.' : 'IndexedDB not available.',
      },
      {
        name: 'Screen Wake Lock API',
        supported: hasWakeLock,
        critical: false,
        details: hasWakeLock ? 'Screen will remain awake during monitoring.' : 'User must keep device awake manually.',
      },
      {
        name: 'Service Worker & Offline PWA',
        supported: hasServiceWorker,
        critical: false,
        details: hasServiceWorker ? 'Offline PWA caching active.' : 'App requires active web page load.',
      },
      {
        name: 'Storage Quota Estimation',
        supported: hasStorageEstimate,
        critical: false,
        details: hasStorageEstimate ? 'Storage usage and capacity calculation available.' : 'Storage estimation not supported.',
      },
    ];

    const isFullyCompatible = items.filter((i) => i.critical).every((i) => i.supported);

    return {
      isFullyCompatible,
      items,
    };
  }
}
