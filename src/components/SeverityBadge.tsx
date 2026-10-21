import React from 'react';
import { Severity } from '../types';

interface Props {
  severity: Severity;
  score?: number | null;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<Props> = ({ severity, score, size = 'md' }) => {
  const getStyles = () => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'High':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'Medium':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Low':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'Informational':
      default:
        return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
  };

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-semibold rounded border uppercase tracking-wider ${getStyles()} ${padding}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80"></span>
      {severity}
      {score !== undefined && score !== null && (
        <span className="ml-1.5 px-1 py-0.2 text-[10px] bg-black/40 rounded font-mono">
          {score.toFixed(1)}
        </span>
      )}
    </span>
  );
};
