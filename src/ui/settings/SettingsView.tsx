import React, { useState, useEffect } from 'react';
import { DspConfiguration, DEFAULT_DSP_CONFIG } from '../../domain/types';
import { SessionRepository } from '../../storage/SessionRepository';
import { Settings, Shield, HardDrive, Cpu, RefreshCcw, Sparkles, Trash2 } from 'lucide-react';

interface SettingsViewProps {
  config: DspConfiguration;
  isDemoMode: boolean;
  demoBpm: number;
  onUpdateConfig: (newConfig: Partial<DspConfiguration>) => void;
  onToggleDemoMode: (enabled: boolean) => void;
  onSetDemoBpm: (bpm: number) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  isDemoMode,
  demoBpm,
  onUpdateConfig,
  onToggleDemoMode,
  onSetDemoBpm,
}) => {
  const [storageUsageMb, setStorageUsageMb] = useState<number>(0);
  const [storageQuotaMb, setStorageQuotaMb] = useState<number>(0);
  const [retentionPolicy, setRetentionPolicy] = useState<string>('never');

  const refreshStorage = () => {
    if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then((est) => {
        setStorageUsageMb((est.usage || 0) / 1024 / 1024);
        setStorageQuotaMb((est.quota || 0) / 1024 / 1024);
      });
    }
  };

  useEffect(() => {
    refreshStorage();
  }, []);

  const handleResetDefaults = () => {
    onUpdateConfig(DEFAULT_DSP_CONFIG);
  };

  const handleClearAllSessions = async () => {
    if (confirm('Are you sure you want to delete ALL local Doppler recording sessions? This cannot be undone.')) {
      const all = await SessionRepository.getAllSessions();
      for (const s of all) {
        await SessionRepository.deleteSession(s.id);
      }
      alert('All local sessions cleared.');
      refreshStorage();
    }
  };

  return (
    <div className="space-y-5 pb-24 max-w-2xl mx-auto px-4 pt-2">
      <div>
        <h2 className="text-lg font-bold text-zinc-100 flex items-center space-x-2">
          <Settings className="h-5 w-5 text-cyan-400" />
          <span>Platform Settings & DSP Tuning</span>
        </h2>
        <p className="text-xs text-zinc-400">Configure signal processing filters, demo mode, and local storage.</p>
      </div>

      {/* Demo Mode / Simulation Switch */}
      <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <div>
              <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                Demo Simulation Mode
              </span>
              <p className="text-[11px] text-purple-300/80">
                Simulate realistic Doppler heart sounds without physical hardware
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isDemoMode}
            onChange={(e) => onToggleDemoMode(e.target.checked)}
            className="h-5 w-5 accent-purple-500 rounded cursor-pointer"
          />
        </div>

        {isDemoMode && (
          <div className="pt-2 border-t border-purple-500/20 space-y-1.5">
            <div className="flex justify-between text-xs text-purple-200">
              <span>Simulated Target FHR:</span>
              <span className="font-mono font-bold">{demoBpm} BPM</span>
            </div>
            <input
              type="range"
              min="60"
              max="200"
              value={demoBpm}
              onChange={(e) => onSetDemoBpm(Number(e.target.value))}
              className="w-full accent-purple-400"
            />
          </div>
        )}
      </div>

      {/* DSP Filter Parameters */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-semibold text-zinc-200">DSP Filter Configuration</span>
          </div>
          <button
            onClick={handleResetDefaults}
            className="flex items-center space-x-1 text-[11px] text-zinc-400 hover:text-cyan-400"
          >
            <RefreshCcw className="h-3 w-3" />
            <span>Reset Defaults</span>
          </button>
        </div>

        {/* Low-Cut Bandpass */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">High-pass Low Cutoff</span>
            <span className="font-mono text-zinc-200 font-semibold">{config.bandpassLowCutHz} Hz</span>
          </div>
          <input
            type="range"
            min="30"
            max="150"
            step="5"
            value={config.bandpassLowCutHz}
            onChange={(e) => onUpdateConfig({ bandpassLowCutHz: Number(e.target.value) })}
            className="w-full accent-cyan-500"
          />
        </div>

        {/* High-Cut Bandpass */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Low-pass High Cutoff</span>
            <span className="font-mono text-zinc-200 font-semibold">{config.bandpassHighCutHz} Hz</span>
          </div>
          <input
            type="range"
            min="500"
            max="2000"
            step="50"
            value={config.bandpassHighCutHz}
            onChange={(e) => onUpdateConfig({ bandpassHighCutHz: Number(e.target.value) })}
            className="w-full accent-cyan-500"
          />
        </div>

        {/* Confidence Threshold */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">Autocorrelation Gating Threshold</span>
            <span className="font-mono text-zinc-200 font-semibold">{(config.confidenceThreshold * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="0.8"
            step="0.05"
            value={config.confidenceThreshold}
            onChange={(e) => onUpdateConfig({ confidenceThreshold: Number(e.target.value) })}
            className="w-full accent-cyan-500"
          />
        </div>
      </div>

      {/* Storage Management */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HardDrive className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-zinc-200">Local Browser Storage</span>
          </div>
          <button
            onClick={handleClearAllSessions}
            className="flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear Storage</span>
          </button>
        </div>

        <div className="flex justify-between items-center text-xs py-1">
          <span className="text-zinc-400">OPFS / IndexedDB Used:</span>
          <span className="font-mono text-zinc-200 font-bold">{storageUsageMb.toFixed(2)} MB / {storageQuotaMb.toFixed(0)} MB</span>
        </div>

        <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
          <div
            className="h-full bg-emerald-500 rounded-full"
            style={{ width: `${Math.min(100, (storageUsageMb / (storageQuotaMb || 1)) * 100)}%` }}
          />
        </div>

        {/* Data Retention */}
        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
          <span className="text-zinc-400">Data Retention Policy:</span>
          <select
            value={retentionPolicy}
            onChange={(e) => setRetentionPolicy(e.target.value)}
            className="rounded-lg bg-zinc-950 border border-zinc-800 px-2 py-1 text-zinc-200 font-medium"
          >
            <option value="never">Never auto-delete</option>
            <option value="30">30 Days</option>
            <option value="90">90 Days</option>
            <option value="365">1 Year</option>
          </select>
        </div>
      </div>

      {/* Safety & Compliance Notice */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
        <div className="flex items-center space-x-2 text-zinc-300">
          <Shield className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-semibold uppercase tracking-wider">Safety & Regulatory Classification</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Doppler PWA is an experimental digital signal processing research platform. Derived FHR measurements are mathematical approximations and must never be interpreted as medical determinations of fetal wellbeing, distress, or clinical normality.
        </p>
      </div>
    </div>
  );
};
