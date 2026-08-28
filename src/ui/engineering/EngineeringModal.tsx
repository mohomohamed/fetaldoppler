import React, { useState, useEffect } from 'react';
import { Logger, LogEntry } from '../../domain/Logger';
import { ExportManager } from '../../recording/ExportManager';
import { VerifiedTrackSettings, SignalMetrics, DspConfiguration } from '../../domain/types';
import { Terminal, Download, X } from 'lucide-react';

interface EngineeringModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCapturing: boolean;
  sampleRate: number;
  trackSettings: VerifiedTrackSettings | null;
  metrics: SignalMetrics;
  dspConfig: DspConfiguration;
  lastValidEstimateTimeMs: number | null;
}

export const EngineeringModal: React.FC<EngineeringModalProps> = ({
  isOpen,
  onClose,
  isCapturing,
  sampleRate,
  trackSettings,
  metrics,
  dspConfig,
  lastValidEstimateTimeMs,
}) => {
  const [logs, setLogs] = useState<LogEntry[]>(Logger.getLogs());
  const [storageUsageMb, setStorageUsageMb] = useState<number>(0);
  const [storageQuotaMb, setStorageQuotaMb] = useState<number>(0);

  useEffect(() => {
    const unsub = Logger.subscribe(() => setLogs(Logger.getLogs()));
    if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then((est) => {
        setStorageUsageMb((est.usage || 0) / 1024 / 1024);
        setStorageQuotaMb((est.quota || 0) / 1024 / 1024);
      });
    }
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleDownloadDiagnosticBundle = () => {
    const bundle = {
      app: 'Doppler PWA v1.0',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      isSecureContext: window.isSecureContext,
      capture: {
        isCapturing,
        sampleRate,
        trackSettings,
      },
      metrics,
      dspConfig,
      storage: {
        usageMb: storageUsageMb,
        quotaMb: storageQuotaMb,
      },
      logs: Logger.getLogs(),
    };

    ExportManager.downloadFile(
      JSON.stringify(bundle, null, 2),
      `diagnostic_bundle_${Date.now()}.json`,
      'application/json'
    );
  };

  const estimateAgeSec = lastValidEstimateTimeMs
    ? ((Date.now() - lastValidEstimateTimeMs) / 1000).toFixed(1)
    : 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center space-x-2">
            <Terminal className="h-5 w-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
              Engineering Mode & Diagnostics
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadDiagnosticBundle}
              className="flex items-center space-x-1.5 rounded-lg bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Bundle</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Diagnostic Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3 text-xs">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-2.5">
            <span className="text-[10px] text-zinc-500 uppercase">Capture State</span>
            <p className="font-mono font-bold text-zinc-200">{isCapturing ? 'STREAMING' : 'IDLE'}</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-2.5">
            <span className="text-[10px] text-zinc-500 uppercase">Audio Rate</span>
            <p className="font-mono font-bold text-zinc-200">{sampleRate} Hz</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-2.5">
            <span className="text-[10px] text-zinc-500 uppercase">Estimate Age</span>
            <p className="font-mono font-bold text-zinc-200">{estimateAgeSec}s ago</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-2.5">
            <span className="text-[10px] text-zinc-500 uppercase">RMS / Peak</span>
            <p className="font-mono font-bold text-zinc-200">
              {metrics.rmsDb.toFixed(1)} / {(20 * Math.log10(Math.max(1e-5, metrics.peak))).toFixed(1)} dB
            </p>
          </div>
        </div>

        {/* Live Logs Terminal */}
        <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-zinc-800 bg-black p-3 font-mono text-[11px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 mb-2 text-zinc-500 text-[10px]">
            <span>LOCAL DEVELOPER LOGS ({logs.length})</span>
            <button onClick={() => Logger.clear()} className="hover:text-zinc-300">
              Clear Logs
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 text-zinc-300">
            {logs.length === 0 ? (
              <p className="text-zinc-600">No logs captured yet.</p>
            ) : (
              logs.map((l, i) => (
                <div key={i} className="flex items-start space-x-2">
                  <span className="text-zinc-600 select-none">[{l.timestamp}]</span>
                  <span
                    className={
                      l.level === 'error'
                        ? 'text-rose-400 font-bold'
                        : l.level === 'warn'
                        ? 'text-amber-400'
                        : 'text-cyan-400'
                    }
                  >
                    [{l.level.toUpperCase()}]
                  </span>
                  <span className="flex-1 text-zinc-300">{l.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
