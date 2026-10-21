import React from 'react';
import { FindingStatus } from '../types';
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, XCircle, RefreshCw, FileText } from 'lucide-react';

interface Props {
  status: FindingStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const getStyles = () => {
    switch (status) {
      case 'Verified Vulnerable':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          icon: <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-400" />
        };
      case 'Mitigated':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
        };
      case 'Retested':
        return {
          bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
          icon: <RefreshCw className="w-3.5 h-3.5 mr-1 text-cyan-300" />
        };
      case 'In Progress':
        return {
          bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
          icon: <Clock className="w-3.5 h-3.5 mr-1 text-amber-300" />
        };
      case 'Not Reproduced':
        return {
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
          icon: <XCircle className="w-3.5 h-3.5 mr-1 text-slate-400" />
        };
      case 'Closed':
        return {
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
          icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-blue-400" />
        };
      case 'Planned':
      default:
        return {
          bg: 'bg-slate-700/20 text-slate-300 border-slate-600/40',
          icon: <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" />
        };
    }
  };

  const style = getStyles();
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${style.bg} ${padding}`}>
      {style.icon}
      {status}
    </span>
  );
};
