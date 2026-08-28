import React, { useState, useEffect } from 'react';
import { DiscoveredAudioDevice, VerifiedTrackSettings } from '../../domain/types';
import { AudioDeviceManager } from '../../audio/AudioDeviceManager';
import { Sliders, CheckCircle2, Usb, Headphones, Mic, Cable } from 'lucide-react';

interface DevicesViewProps {
  activeDeviceId: string | null;
  trackSettings: VerifiedTrackSettings | null;
  onSelectDevice: (deviceId: string) => void;
}

export const DevicesView: React.FC<DevicesViewProps> = ({
  activeDeviceId,
  trackSettings,
  onSelectDevice,
}) => {
  const [devices, setDevices] = useState<DiscoveredAudioDevice[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const deviceManager = new AudioDeviceManager();

  const scanDevices = async () => {
    const list = await deviceManager.enumerateDevices();
    setDevices(list);
  };

  useEffect(() => {
    scanDevices();
  }, []);

  const handleRequestPermission = async () => {
    const ok = await deviceManager.requestPermission();
    setPermissionGranted(ok);
    if (ok) {
      await scanDevices();
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'usb':
        return <Usb className="h-4 w-4 text-cyan-400" />;
      case 'headset':
        return <Headphones className="h-4 w-4 text-emerald-400" />;
      default:
        return <Mic className="h-4 w-4 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-5 pb-24 max-w-2xl mx-auto px-4 pt-2">
      <div>
        <h2 className="text-lg font-bold text-zinc-100 flex items-center space-x-2">
          <Sliders className="h-5 w-5 text-cyan-400" />
          <span>Audio Device & Hardware Setup</span>
        </h2>
        <p className="text-xs text-zinc-400">
          Select and verify external USB audio card connection.
        </p>
      </div>

      {/* Permission banner if needed */}
      {!permissionGranted && devices.length <= 1 && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-cyan-200">Microphone Permission</p>
            <p className="text-[11px] text-cyan-300/80">Grant permission to scan connected USB interfaces.</p>
          </div>
          <button
            onClick={handleRequestPermission}
            className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-zinc-950 hover:bg-cyan-400"
          >
            Grant Access
          </button>
        </div>
      )}

      {/* Available Audio Devices */}
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Detected Audio Inputs
        </span>
        <div className="space-y-2">
          {devices.map((d) => {
            const isSelected = activeDeviceId === d.deviceId || (!activeDeviceId && d.isPreferred);
            return (
              <div
                key={d.deviceId}
                onClick={() => onSelectDevice(d.deviceId)}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/10 shadow-sm'
                    : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="rounded-lg bg-zinc-800 p-2">{getDeviceIcon(d.type)}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-zinc-200">{d.label}</span>
                      {d.isPreferred && (
                        <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300">
                          RECOMMENDED USB
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{d.type} device</span>
                  </div>
                </div>

                {isSelected && <CheckCircle2 className="h-5 w-5 text-cyan-400" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Track Verification Inspector */}
      {trackSettings && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Active MediaStreamTrack Inspection
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase">Sample Rate</span>
              <p className="font-mono font-semibold text-zinc-200">{trackSettings.sampleRate || 44100} Hz</p>
            </div>
            <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase">Channels</span>
              <p className="font-mono font-semibold text-zinc-200">{trackSettings.channelCount || 1} Channel</p>
            </div>
            <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase">Echo Cancellation</span>
              <p className="font-mono font-semibold text-zinc-200">
                {trackSettings.echoCancellation ? 'Active (Alert)' : 'Disabled (Clean)'}
              </p>
            </div>
            <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase">Noise Suppression</span>
              <p className="font-mono font-semibold text-zinc-200">
                {trackSettings.noiseSuppression ? 'Active (Alert)' : 'Disabled (Clean)'}
              </p>
            </div>
            <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase">Auto Gain Control</span>
              <p className="font-mono font-semibold text-zinc-200">
                {trackSettings.autoGainControl ? 'Active (Alert)' : 'Disabled (Clean)'}
              </p>
            </div>
            <div className="rounded-lg bg-zinc-950 p-2.5 border border-zinc-800">
              <span className="text-[10px] text-zinc-500 uppercase">Input Type</span>
              <p className="font-mono font-semibold text-zinc-200">
                {trackSettings.isExternalInput ? 'External USB' : 'Built-in Mic'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hardware Connection Wizard */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <Cable className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold text-zinc-200">Physical Hardware Connection Guide</span>
        </div>
        <ol className="space-y-2 text-xs text-zinc-400 list-decimal list-inside">
          <li>
            <strong className="text-zinc-300">Plug in USB Audio Card:</strong> Connect your USB-C audio capture interface into the phone/PC.
          </li>
          <li>
            <strong className="text-zinc-300">Connect 3.5mm Aux Cable:</strong> Plug one end into the Fetal Doppler headphone jack, and the other into the USB Audio Card Microphone/Line-In port.
          </li>
          <li>
            <strong className="text-zinc-300">Power On Doppler:</strong> Set volume to ~60% on the Doppler dial to avoid analog input distortion.
          </li>
        </ol>
      </div>
    </div>
  );
};
