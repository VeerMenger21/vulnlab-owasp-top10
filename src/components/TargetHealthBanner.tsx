import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TargetHealth } from '../types';
import { Activity, ExternalLink, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export const TargetHealthBanner: React.FC = () => {
  const [health, setHealth] = useState<TargetHealth | null>(null);
  const [checking, setChecking] = useState(false);

  const checkTarget = async () => {
    setChecking(true);
    try {
      const data = await api.getTargetHealth();
      setHealth(data);
    } catch (err: any) {
      setHealth({
        status: 'error',
        target_url: 'http://127.0.0.1:3000',
        message: 'Could not communicate with portal health check endpoint.',
        checked_at: new Date().toISOString()
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkTarget();
    const interval = setInterval(checkTarget, 30000); // Recheck every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = () => {
    if (!health) {
      return (
        <span className="inline-flex items-center text-xs text-slate-400">
          <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> Checking target...
        </span>
      );
    }

    if (health.status === 'connected') {
      return (
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            Target Active (HTTP {health.status_code || 200})
          </span>
          {health.latency_ms !== undefined && (
            <span className="text-xs text-slate-400 font-mono">{health.latency_ms}ms</span>
          )}
        </div>
      );
    }

    if (health.status === 'disconnected') {
      return (
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-400" />
            Target Offline / Connection Refused
          </span>
        </div>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
        <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-300" />
        Target Unconfigured
      </span>
    );
  };

  return (
    <div className="bg-lab-900 border-b border-lab-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 text-slate-400">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-300">Target Environment:</span>
          <span className="font-mono text-cyan-300">
            {health?.target_url || 'http://127.0.0.1:3000'}
          </span>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={checkTarget}
          disabled={checking}
          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-lab-800 hover:bg-lab-700 text-slate-300 transition-colors disabled:opacity-50"
          title="Probe Juice Shop target URL"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
          <span>Probe Target</span>
        </button>

        {health?.target_url && (
          <a
            href={health.target_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
          >
            <span>Open Juice Shop</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};
