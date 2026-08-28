import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './ui/components/Navbar';
import { BottomNav, TabType } from './ui/components/BottomNav';
import { MonitorView } from './ui/monitor/MonitorView';
import { SessionsView } from './ui/sessions/SessionsView';
import { ResearchView } from './ui/research/ResearchView';
import { DevicesView } from './ui/devices/DevicesView';
import { SettingsView } from './ui/settings/SettingsView';
import { EngineeringModal } from './ui/engineering/EngineeringModal';
import { CompatibilityModal } from './ui/components/CompatibilityModal';

import { LiveMediaStreamSource, SimulatedDemoSource, DopplerSource } from './audio/DopplerSource';
import { AudioRingBuffer } from './audio/AudioRingBuffer';
import { FhrEstimator } from './fhr/FhrEstimator';
import { PcmWriter } from './recording/PcmWriter';
import { SpectrogramEngine } from './dsp/Spectrogram';
import { SessionRepository } from './storage/SessionRepository';
import { Logger } from './domain/Logger';

import {
  DspConfiguration,
  DEFAULT_DSP_CONFIG,
  FhrEstimationResult,
  SignalMetrics,
  VerifiedTrackSettings,
  SessionMetadata,
} from './domain/types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('monitor');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Modals
  const [isEngineeringOpen, setIsEngineeringOpen] = useState(false);
  const [isCompatibilityOpen, setIsCompatibilityOpen] = useState(false);

  // Demo Simulation Mode
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoBpm, setDemoBpm] = useState(140);

  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [activeDeviceLabel, setActiveDeviceLabel] = useState<string>('No Audio Device');
  const [trackSettings, setTrackSettings] = useState<VerifiedTrackSettings | null>(null);

  const [dspConfig, setDspConfig] = useState<DspConfiguration>(DEFAULT_DSP_CONFIG);
  const [waveformSamples, setWaveformSamples] = useState<Float32Array>(new Float32Array(2048));
  const [liveSpectrogramFrames, setLiveSpectrogramFrames] = useState<Float32Array[]>([]);

  const [metrics, setMetrics] = useState<SignalMetrics>({
    rms: 0,
    rmsDb: -100,
    peak: 0,
    dcOffset: 0,
    clipping: false,
    clipCount: 0,
    snrEstimate: 0,
    dominantFrequency: 0,
  });

  const [estimation, setEstimation] = useState<FhrEstimationResult | null>(null);
  const [lastValidEstimateTime, setLastValidEstimateTime] = useState<number | null>(null);

  // Engine references
  const liveSourceRef = useRef<LiveMediaStreamSource>(new LiveMediaStreamSource());
  const demoSourceRef = useRef<SimulatedDemoSource>(new SimulatedDemoSource(140));
  const ringBufferRef = useRef<AudioRingBuffer>(new AudioRingBuffer(44100 * 6)); // 6s buffer (with pre-roll)
  const estimatorRef = useRef<FhrEstimator>(new FhrEstimator(44100, dspConfig));
  const pcmWriterRef = useRef<PcmWriter>(new PcmWriter());
  const spectrogramEngineRef = useRef<SpectrogramEngine>(new SpectrogramEngine(512, 256, 44100));

  const currentSessionIdRef = useRef<string | null>(null);
  const sessionStartTimeRef = useRef<number>(0);
  const recordingTimerRef = useRef<any>(null);

  const activeSource: DopplerSource = isDemoMode ? demoSourceRef.current : liveSourceRef.current;

  // Periodic estimation loop (every 120ms)
  useEffect(() => {
    let animId: number;
    let lastEstimateTime = 0;

    const loop = (timestamp: number) => {
      if (isCapturing) {
        // Read recent 2048 samples for waveform display
        const recentSamples = ringBufferRef.current.readLatest(2048);
        setWaveformSamples(new Float32Array(recentSamples));

        // Process FHR every 120ms
        if (timestamp - lastEstimateTime > 120) {
          lastEstimateTime = timestamp;
          const windowSamples = ringBufferRef.current.readLatest(44100 * 2.5); // 2.5s analysis window

          if (windowSamples.length > 4000) {
            const { result, metrics: m } = estimatorRef.current.processWindow(windowSamples);
            setEstimation(result);
            setMetrics(m);

            if (result.estimatedBpm) {
              setLastValidEstimateTime(Date.now());
            }

            // Compute spectrogram frame
            const frame = spectrogramEngineRef.current.computeSingleFrame(windowSamples);
            setLiveSpectrogramFrames((prev) => {
              const updated = [...prev, frame];
              return updated.length > 80 ? updated.slice(updated.length - 80) : updated;
            });
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isCapturing]);

  const handleToggleCapture = useCallback(async () => {
    if (isCapturing) {
      if (isRecording) {
        await handleStopRecording();
      }
      await activeSource.stop();
      setIsCapturing(false);
      estimatorRef.current.reset();
      setEstimation(null);
      Logger.info(`Capture stopped (${activeSource.name})`);
    } else {
      try {
        if (!isDemoMode && activeDeviceId) {
          liveSourceRef.current.setDeviceId(activeDeviceId);
        }

        const verified = await activeSource.start((chunk) => {
          ringBufferRef.current.write(chunk);
          if (isRecording) {
            pcmWriterRef.current.appendChunk(chunk);
          }
        });

        if (verified) {
          setTrackSettings(verified);
          estimatorRef.current.setSampleRate(activeSource.sampleRate);
          const label = isDemoMode
            ? 'Simulated Doppler Pulse Generator'
            : verified.isExternalInput
            ? 'USB Audio Interface'
            : 'Built-in Audio Track';
          setActiveDeviceLabel(label);
        }

        setIsCapturing(true);
        Logger.info(`Capture started on ${activeSource.name} @ ${activeSource.sampleRate} Hz`);
      } catch (err: any) {
        Logger.error(`Failed to start capture: ${err.message || err}`);
        alert('Could not start audio capture: ' + (err.message || err));
      }
    }
  }, [isCapturing, isRecording, isDemoMode, activeDeviceId, activeSource]);

  const handleStartRecording = async () => {
    const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    currentSessionIdRef.current = sessionId;
    sessionStartTimeRef.current = Date.now();
    setRecordingSeconds(0);

    await pcmWriterRef.current.initSession(sessionId);

    // Pre-roll: write existing buffered audio (last 2 seconds) to recording
    const preRoll = ringBufferRef.current.readLatest(activeSource.sampleRate * 2);
    if (preRoll.length > 0) {
      await pcmWriterRef.current.appendChunk(preRoll);
    }

    setIsRecording(true);
    Logger.info(`Started recording session [${sessionId}] with pre-roll`);

    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const handleStopRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    clearInterval(recordingTimerRef.current);

    const sessionId = currentSessionIdRef.current || 'sess_' + Date.now();
    const startTime = sessionStartTimeRef.current;
    const endTime = Date.now();
    const durationMs = endTime - startTime;

    const sampleRate = activeSource.sampleRate;
    const { wavBlob, byteLength } = await pcmWriterRef.current.finalize(sampleRate);

    const session: SessionMetadata = {
      id: sessionId,
      title: `Doppler Session ${new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      startTime,
      endTime,
      durationMs,
      sampleRate,
      channels: 1,
      deviceLabel: activeDeviceLabel,
      isExternalDevice: trackSettings?.isExternalInput || false,
      storageType: 'opfs',
      pcmByteLength: byteLength,
      averageBpm: estimation?.estimatedBpm || null,
      qualitySummary: {
        strongPercent: 70,
        moderatePercent: 20,
        weakPercent: 10,
        unusablePercent: 0,
      },
    };

    await SessionRepository.saveSession(session, wavBlob);
    pcmWriterRef.current.clear();
    Logger.info(`Finalized recording [${sessionId}]: ${(byteLength / 1024 / 1024).toFixed(2)} MB WAV saved`);
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      handleStartRecording();
    }
  };

  const handleAddMarker = async (label: string) => {
    if (!currentSessionIdRef.current) return;
    const marker = {
      id: 'marker_' + Date.now(),
      sessionId: currentSessionIdRef.current,
      timestampMs: Date.now() - sessionStartTimeRef.current,
      type: 'user' as const,
      label,
    };
    await SessionRepository.addMarker(marker);
    Logger.info(`User marker added: "${label}" @ ${(marker.timestampMs / 1000).toFixed(1)}s`);
  };

  const handleUpdateDspConfig = (newConfig: Partial<DspConfiguration>) => {
    setDspConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      estimatorRef.current.updateConfig(updated);
      Logger.info(`DSP configuration updated: ${JSON.stringify(newConfig)}`);
      return updated;
    });
  };

  const handleToggleDemoMode = async (enabled: boolean) => {
    if (isCapturing) {
      await handleToggleCapture();
    }
    setIsDemoMode(enabled);
    Logger.info(`Demo Mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
  };

  const handleSetDemoBpm = (bpm: number) => {
    setDemoBpm(bpm);
    demoSourceRef.current.setBpm(bpm);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar
        isCapturing={isCapturing}
        isRecording={isRecording}
        isDemoMode={isDemoMode}
        activeDeviceLabel={activeDeviceLabel}
        onOpenEngineering={() => setIsEngineeringOpen(true)}
        onOpenCompatibility={() => setIsCompatibilityOpen(true)}
      />

      <main className="flex-1 overflow-y-auto">
        {activeTab === 'monitor' && (
          <MonitorView
            isCapturing={isCapturing}
            isRecording={isRecording}
            recordingDurationSeconds={recordingSeconds}
            waveformSamples={waveformSamples}
            sampleRate={activeSource.sampleRate}
            metrics={metrics}
            estimation={estimation}
            trackSettings={trackSettings}
            onToggleCapture={handleToggleCapture}
            onToggleRecord={handleToggleRecord}
            onAddMarker={handleAddMarker}
          />
        )}

        {activeTab === 'sessions' && <SessionsView />}

        {activeTab === 'research' && (
          <ResearchView liveSpectrogramFrames={liveSpectrogramFrames} />
        )}

        {activeTab === 'devices' && (
          <DevicesView
            activeDeviceId={activeDeviceId}
            trackSettings={trackSettings}
            onSelectDevice={(id) => {
              setActiveDeviceId(id);
              Logger.info(`Device selected: ${id}`);
            }}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            config={dspConfig}
            isDemoMode={isDemoMode}
            demoBpm={demoBpm}
            onUpdateConfig={handleUpdateDspConfig}
            onToggleDemoMode={handleToggleDemoMode}
            onSetDemoBpm={handleSetDemoBpm}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />

      {/* Modals */}
      <EngineeringModal
        isOpen={isEngineeringOpen}
        onClose={() => setIsEngineeringOpen(false)}
        isCapturing={isCapturing}
        sampleRate={activeSource.sampleRate}
        trackSettings={trackSettings}
        metrics={metrics}
        dspConfig={dspConfig}
        lastValidEstimateTimeMs={lastValidEstimateTime}
      />

      <CompatibilityModal
        isOpen={isCompatibilityOpen}
        onClose={() => setIsCompatibilityOpen(false)}
      />
    </div>
  );
};
