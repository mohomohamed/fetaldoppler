import React from 'react';
import { Activity, HardDrive, Terminal, ShieldCheck, Sparkles } from 'lucide-react';

interface NavbarProps {
  isCapturing: boolean;
  isRecording: boolean;
  isDemoMode: boolean;
  activeDeviceLabel?: string;
  storageEstimateMb?: number;
  onOpenEngineering: () => void;
  onOpenCompatibility: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isCapturing,
  isRecording,
  isDemoMode,
  activeDeviceLabel,
  storageEstimateMb,
  onOpenEngineering,
  onOpenCompatibility,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/90 px-4 py-3 backdrop-blur-md">
      <div className="flex items-center space-x-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
          <Activity className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-sm font-semibold tracking-wide text-zinc-100">Doppler PWA</h1>
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-zinc-400">
              v1.0 EXP
            </span>
            {isDemoMode && (
              <span className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-purple-300 border border-purple-500/30 flex items-center space-x-1">
                <Sparkles className="h-2.5 w-2.5" />
                <span>DEMO</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 truncate max-w-[150px] sm:max-w-xs">
            {activeDeviceLabel || 'No Input Connected'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-1.5 sm:space-x-2.5">
        {isRecording && (
          <div className="flex items-center space-x-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-rose-400 border border-rose-500/20 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span className="text-[11px] font-medium tracking-wide">REC</span>
          </div>
        )}

        {isCapturing && !isRecording && (
          <div className="flex items-center space-x-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-emerald-400 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px] font-medium">LIVE</span>
          </div>
        )}

        {/* Compatibility Check Button */}
        <button
          onClick={onOpenCompatibility}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-cyan-300 hover:border-cyan-500/30 transition-all"
          title="Browser Capability & Compatibility"
        >
          <ShieldCheck className="h-4 w-4" />
        </button>

        {/* Engineering Mode Button */}
        <button
          onClick={onOpenEngineering}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-cyan-300 hover:border-cyan-500/30 transition-all"
          title="Engineering Diagnostics & Logs"
        >
          <Terminal className="h-4 w-4" />
        </button>

        {storageEstimateMb !== undefined && (
          <div className="hidden md:flex items-center space-x-1 text-zinc-500 text-xs">
            <HardDrive className="h-3.5 w-3.5" />
            <span>{storageEstimateMb.toFixed(0)} MB</span>
          </div>
        )}
      </div>
    </header>
  );
};
