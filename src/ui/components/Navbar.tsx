import React from 'react';
import { Activity, HardDrive } from 'lucide-react';

interface NavbarProps {
  isCapturing: boolean;
  isRecording: boolean;
  activeDeviceLabel?: string;
  storageEstimateMb?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  isCapturing,
  isRecording,
  activeDeviceLabel,
  storageEstimateMb,
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
          </div>
          <p className="text-[11px] text-zinc-400 truncate max-w-[180px] sm:max-w-xs">
            {activeDeviceLabel || 'No Input Connected'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
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

        {storageEstimateMb !== undefined && (
          <div className="hidden sm:flex items-center space-x-1 text-zinc-500 text-xs">
            <HardDrive className="h-3.5 w-3.5" />
            <span>{storageEstimateMb.toFixed(0)} MB Free</span>
          </div>
        )}
      </div>
    </header>
  );
};
