import React, { useState, useEffect } from 'react';
import { BrowserCapabilities, CompatibilityReport } from '../../domain/BrowserCapabilities';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, X } from 'lucide-react';

interface CompatibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CompatibilityModal: React.FC<CompatibilityModalProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState<CompatibilityReport | null>(null);

  useEffect(() => {
    if (isOpen) {
      BrowserCapabilities.check().then(setReport);
    }
  }, [isOpen]);

  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl overflow-hidden space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
              Browser Capability & Compatibility Check
            </h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {report.items.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-start justify-between rounded-xl border p-3 ${
                item.supported
                  ? 'border-zinc-800 bg-zinc-900/40'
                  : item.critical
                  ? 'border-rose-500/40 bg-rose-500/10'
                  : 'border-amber-500/30 bg-amber-500/10'
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-200">{item.name}</span>
                <p className="text-[11px] text-zinc-400">{item.details}</p>
              </div>

              <div className="ml-3 mt-0.5">
                {item.supported ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : item.critical ? (
                  <XCircle className="h-4 w-4 text-rose-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-800 pt-3 flex justify-between items-center text-xs">
          <span className="text-zinc-400">
            {report.isFullyCompatible ? 'Ready for live Doppler capture' : 'Some non-critical features degraded'}
          </span>
          <button
            onClick={onClose}
            className="rounded-lg bg-cyan-500 px-4 py-1.5 font-bold text-zinc-950 hover:bg-cyan-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
