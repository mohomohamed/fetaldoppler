import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './ui/components/Navbar';
import { BottomNav, TabType } from './ui/components/BottomNav';
import { MonitorView } from './ui/monitor/MonitorView';
import { SessionsView } from './ui/sessions/SessionsView';
import { ResearchView } from './ui/research/ResearchView';
import { DevicesView } from './ui/devices/DevicesView';
import { SettingsView } from './ui/settings/SettingsView';

import { AudioCaptureEngine } from './audio/AudioCaptureEngine';
import { AudioRingBuffer } from './audio/AudioRingBuffer';
import { FhrEstimator } from './fhr/FhrEstimator';
import { PcmWriter } from './recording/PcmWriter';
import { SpectrogramEngine } from './dsp/Spectrogram';
import { SessionRepository } from './storage/SessionRepository';

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

  // Engine references
  const captureEngineRef = useRef<AudioCaptureEngine>(new AudioCaptureEngine());
  const ringBufferRef = useRef<AudioRingBuffer>(new AudioRingBuffer(44100 * 5)); // 5s buffer
  const estimatorRef = useRef<FhrEstimator>(new FhrEstimator(44100, dspConfig));
  const pcmWriterRef = useRef<PcmWriter>(new PcmWriter());
  const spectrogramEngineRef = useRef<SpectrogramEngine>(new SpectrogramEngine(512, 256, 44100));

  const currentSessionIdRef = useRef<string | null>(null);
  const sessionStartTimeRef = useRef<number>(0);
  const recordingTimerRef = useRef<any>(null);

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

  // Hook up audio capture chunk receiver
  useEffect(() => {
    const unsubscribe = captureEngineRef.current.subscribeChunks((chunk) => {
      ringBufferRef.current.write(chunk);
      if (isRecording) {
        pcmWriterRef.current.appendChunk(chunk);
      }
    });

    return () => unsubscribe();
  }, [isRecording]);

  const handleToggleCapture = useCallback(async () => {
    if (isCapturing) {
      if (isRecording) {
        await handleStopRecording();
      }
      await captureEngineRef.current.stop();
      setIsCapturing(false);
      estimatorRef.current.reset();
      setEstimation(null);
    } else {
      try {
        const verified = await captureEngineRef.current.start(activeDeviceId || undefined);
        setTrackSettings(verified);
        estimatorRef.current.setSampleRate(captureEngineRef.current.sampleRate);
        setIsCapturing(true);

        const label = verified.isExternalInput ? 'USB Audio Interface' : 'Built-in Audio Track';
        setActiveDeviceLabel(label);
      } catch (err: any) {
        alert('Could not start audio capture: ' + (err.message || err));
      }
    }
  }, [isCapturing, isRecording, activeDeviceId]);

  const handleStartRecording = async () => {
    const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    currentSessionIdRef.current = sessionId;
    sessionStartTimeRef.current = Date.now();
    setRecordingSeconds(0);

    await pcmWriterRef.current.initSession(sessionId);
    setIsRecording(true);

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

    const sampleRate = captureEngineRef.current.sampleRate;
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
    await SessionRepository.addMarker({
      id: 'marker_' + Date.now(),
      sessionId: currentSessionIdRef.current,
      timestampMs: Date.now() - sessionStartTimeRef.current,
      type: 'user',
      label,
    });
  };

  const handleUpdateDspConfig = (newConfig: Partial<DspConfiguration>) => {
    setDspConfig((prev) => {
      const updated = { ...prev, ...newConfig };
      estimatorRef.current.updateConfig(updated);
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Navbar
        isCapturing={isCapturing}
        isRecording={isRecording}
        activeDeviceLabel={activeDeviceLabel}
      />

      <main className="flex-1 overflow-y-auto">
        {activeTab === 'monitor' && (
          <MonitorView
            isCapturing={isCapturing}
            isRecording={isRecording}
            recordingDurationSeconds={recordingSeconds}
            waveformSamples={waveformSamples}
            sampleRate={captureEngineRef.current.sampleRate}
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
            onSelectDevice={(id) => setActiveDeviceId(id)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            config={dspConfig}
            onUpdateConfig={handleUpdateDspConfig}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />
    </div>
  );
};
