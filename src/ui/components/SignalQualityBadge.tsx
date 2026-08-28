import React from 'react';
import { SignalQualityLevel } from '../../domain/types';
import { ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';

interface SignalQualityBadgeProps {
  quality: SignalQualityLevel;
  confidence: number;
}

export const SignalQualityBadge: React.FC<SignalQualityBadgeProps> = ({ quality, confidence }) => {
  const configs: Record<
    SignalQualityLevel,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode; desc: string }
  > = {
    strong: {
      label: 'STRONG SIGNAL',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      desc: 'High capture fidelity',
    },
    moderate: {
      label: 'MODERATE SIGNAL',
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      desc: 'Acceptable periodicity',
    },
    weak: {
      label: 'WEAK SIGNAL',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      desc: 'High noise or low level',
    },
    unusable: {
      label: 'NO SIGNAL / UNUSABLE',
      bg: 'bg-zinc-800/40',
      text: 'text-zinc-500',
      border: 'border-zinc-800',
      icon: <XCircle className="h-3.5 w-3.5" />,
      desc: 'Searching for Doppler audio',
    },
  };

  const current = configs[quality];

  return (
    <div className={`flex items-center justify-between rounded-xl border p-2.5 ${current.bg} ${current.border}`}>
      <div className="flex items-center space-x-2">
        <span className={current.text}>{current.icon}</span>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className={`text-[11px] font-bold tracking-wider ${current.text}`}>
              {current.label}
            </span>
          </div>
          <p className="text-[10px] text-zinc-400">{current.desc}</p>
        </div>
      </div>

      <div className="text-right">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
          Confidence
        </span>
        <p className="text-xs font-mono font-semibold text-zinc-200">
          {(confidence * 100).toFixed(0)}%
        </p>
      </div>
    </div>
  );
};
