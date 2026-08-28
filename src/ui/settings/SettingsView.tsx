import React, { useState, useEffect } from 'react';
import { DspConfiguration, DEFAULT_DSP_CONFIG } from '../../domain/types';
import { Settings, Shield, HardDrive, Cpu, RefreshCcw } from 'lucide-react';

interface SettingsViewProps {
  config: DspConfiguration;
  onUpdateConfig: (newConfig: Partial<DspConfiguration>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ config, onUpdateConfig }) => {
  const [storageUsageMb, setStorageUsageMb] = useState<number>(0);
  const [storageQuotaMb, setStorageQuotaMb] = useState<number>(0);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then((est) => {
        setStorageUsageMb((est.usage || 0) / 1024 / 1024);
        setStorageQuotaMb((est.quota || 0) / 1024 / 1024);
      });
    }
  }, []);

  const handleResetDefaults = () => {
    onUpdateConfig(DEFAULT_DSP_CONFIG);
  };

  return (
    <div className="space-y-5 pb-24 max-w-2xl mx-auto px-4 pt-2">
      <div>
        <h2 className="text-lg font-bold text-zinc-100 flex items-center space-x-2">
          <Settings className="h-5 w-5 text-cyan-400" />
          <span>Platform Settings & DSP Tuning</span>
        </h2>
        <p className="text-xs text-zinc-400">Configure signal processing filters and local storage.</p>
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
        <div className="flex items-center space-x-2">
          <HardDrive className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-200">Local Browser Storage</span>
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
