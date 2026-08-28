// ============================================================================
// Doppler PWA Domain Models and Type Definitions
// ============================================================================

export type SignalQualityLevel = 'unusable' | 'weak' | 'moderate' | 'strong';

export type MonitorState = 
  | 'idle' 
  | 'searching' 
  | 'acquiring' 
  | 'tracking' 
  | 'lost' 
  | 'stopped';

export type AudioInputType = 'usb' | 'headset' | 'built-in' | 'bluetooth' | 'unknown';

export interface DiscoveredAudioDevice {
  deviceId: string;
  label: string;
  groupId: string;
  type: AudioInputType;
  isPreferred: boolean;
}

export interface VerifiedTrackSettings {
  deviceId?: string;
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  autoGainControl?: boolean;
  noiseSuppression?: boolean;
  latency?: number;
  isExternalInput: boolean;
  warnings: string[];
}

export interface SignalMetrics {
  rms: number;               // 0.0 to 1.0 (linear amplitude)
  rmsDb: number;             // in decibels (-inf to 0 dBFS)
  peak: number;              // max absolute sample value
  dcOffset: number;          // DC bias
  clipping: boolean;         // true if sample reached >= 0.999
  clipCount: number;         // number of clipped samples in frame
  snrEstimate: number;       // approximate SNR in dB
  dominantFrequency: number; // Hz
}

export interface FhrCandidate {
  bpm: number;
  score: number;             // 0.0 - 1.0
  type: 'autocorrelation' | 'peak_interval' | 'spectral';
}

export interface FhrEstimationResult {
  estimatedBpm: number | null; // null if confidence is below threshold
  rawBpm: number | null;
  confidence: number;          // 0.0 to 1.0
  quality: SignalQualityLevel;
  timestampMs: number;
  candidates: FhrCandidate[];
  isHarmonicCorrected: boolean;
  isMaternalWarning: boolean;
  isDropout: boolean;
}

export interface SessionMetadata {
  id: string;
  title: string;
  startTime: number;
  endTime?: number;
  durationMs: number;
  sampleRate: number;
  channels: number;
  deviceLabel: string;
  isExternalDevice: boolean;
  storageType: 'opfs' | 'idb';
  pcmByteLength: number;
  averageBpm?: number | null;
  qualitySummary: {
    strongPercent: number;
    moderatePercent: number;
    weakPercent: number;
    unusablePercent: number;
  };
  notes?: string;
}

export interface SessionMarker {
  id: string;
  sessionId: string;
  timestampMs: number;
  type: 'user' | 'movement' | 'dropout' | 'device_change' | 'maternal_flag';
  label: string;
}

export interface SpectrogramFrame {
  timestampMs: number;
  frequencies: Float32Array; // Magnitude spectrum in dB
}

export interface DspConfiguration {
  dcBlockerEnabled: boolean;
  bandpassLowCutHz: number;   // e.g. 50 Hz
  bandpassHighCutHz: number;  // e.g. 1200 Hz
  envelopeAttackMs: number;   // e.g. 10 ms
  envelopeDecayMs: number;    // e.g. 80 ms
  minFhrBpm: number;          // 50 BPM
  maxFhrBpm: number;          // 240 BPM
  confidenceThreshold: number;// e.g. 0.45
  maternalExclusionEnabled: boolean;
}

export const DEFAULT_DSP_CONFIG: DspConfiguration = {
  dcBlockerEnabled: true,
  bandpassLowCutHz: 60,
  bandpassHighCutHz: 1200,
  envelopeAttackMs: 15,
  envelopeDecayMs: 65,
  minFhrBpm: 50,
  maxFhrBpm: 240,
  confidenceThreshold: 0.45,
  maternalExclusionEnabled: true,
};
