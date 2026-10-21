import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardStats, Finding, TargetHealth } from '../types';
import { PageId } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import {
  ShieldAlert, Terminal, CheckCircle2,
  Clock, AlertTriangle, Archive, RefreshCw, ExternalLink,
  Layers, ArrowUpRight, Wrench, Shield
} from 'lucide-react';

interface Props {
  onNavigate: (page: PageId, findingId?: string) => void;
}

export const OverviewPage: React.FC<Props> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [health, setHealth] = useState<TargetHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [statsData, findingsData, healthData] = await Promise.all([
        api.getStats(),
        api.getFindings(),
        api.getTargetHealth()
      ]);
      setStats(statsData);
      setFindings(findingsData);
      setHealth(healthData);
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2 text-cyan-400" />
        <span>Loading assessment overview...</span>
      </div>
    );
  }

  const metricCards = [
    {
      label: 'Vulnerability Catalog',
      value: stats?.totalFindings || 0,
      sub: 'Categorized OWASP Top 10 items',
      icon: Shield,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20'
    },
    {
      label: 'Planned Assessments',
      value: stats?.plannedTests || 0,
      sub: 'Awaiting execution',
      icon: Clock,
      color: 'text-slate-300',
      bg: 'bg-slate-700/20 border-slate-700'
    },
    {
      label: 'Verified Vulnerable',
      value: stats?.verifiedVulnerable || 0,
      sub: 'Confirmed via evidence',
      icon: AlertTriangle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20'
    },
    {
      label: 'Remediations Tested',
      value: stats?.retestedFindings || 0,
      sub: 'Verified against patched target',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    {
      label: 'Evidence Artifacts',
      value: stats?.evidenceCount || 0,
      sub: 'Screenshots & HTTP transcripts',
      icon: Archive,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Project Hero Header */}
      <div className="rounded-xl border border-lab-700 bg-gradient-to-r from-lab-900 via-lab-850 to-lab-900 p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                ACADEMIC CAPSTONE LAB
              </span>
              <span className="text-xs text-slate-400 font-mono">OWASP Top 10:2021</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Exploiting and Mitigating OWASP Top 10 Vulnerabilities in OWASP Juice Shop
            </h2>
            <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
              An empirical security assessment, controlled testing, evidence collection, and secure code verification platform for undergraduate computer engineering.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('workspace')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <Terminal className="w-4 h-4" />
              <span>Launch Assessment</span>
            </button>
            <button
              onClick={() => onNavigate('catalog')}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-lab-800 hover:bg-lab-700 border border-lab-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Explore Catalog</span>
            </button>
          </div>
        </div>

        {/* Target Details Strip */}
        <div className="mt-5 pt-4 border-t border-lab-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">Target Application:</span>
            <span className="font-semibold text-slate-200">OWASP Juice Shop v16.0.0</span>
          </div>
          <div>
            <span className="text-slate-500 block">Target Host:</span>
            <span className="font-mono text-cyan-300">{health?.target_url || 'http://127.0.0.1:3000'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Target Status:</span>
            <span className={health?.status === 'connected' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              {health?.status === 'connected' ? `Connected (HTTP ${health.status_code || 200})` : 'Offline / Container Stopped'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Companion Testbed:</span>
            <span className="font-mono text-slate-300">Port 5000 (Active)</span>
          </div>
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {metricCards.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className={`p-4 rounded-xl border ${m.bg} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{m.label}</span>
                <Icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight">{m.value}</div>
              <div className="text-[11px] text-slate-400">{m.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Findings & Test Status */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Catalog Vulnerability Assessment Status</span>
            </h3>
            <button
              onClick={() => onNavigate('catalog')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
            >
              <span>View All Catalog Items</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {findings.slice(0, 6).map((f) => (
              <div
                key={f.id}
                onClick={() => onNavigate('finding-detail', f.id)}
                className="p-3.5 rounded-lg border border-lab-700 bg-lab-900 hover:border-cyan-500/40 hover:bg-lab-850 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">{f.id}</span>
                    <span className="text-xs text-slate-400 font-medium">| {f.owasp_id}</span>
                    <SeverityBadge severity={f.severity} score={f.cvss_score} size="sm" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200">{f.title}</h4>
                  <div className="text-xs text-slate-400 font-mono truncate max-w-md">
                    {f.target_method || 'GET'} {f.target_endpoint || f.affected_component}
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-center shrink-0">
                  <StatusBadge status={f.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Lab Diagnostics & Fast Actions */}
        <div className="space-y-4">
          {/* Target Application Health Card */}
          <div className="p-4 rounded-xl border border-lab-700 bg-lab-900 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <span>Target Lab Health</span>
              </h3>
              <span className={`w-2 h-2 rounded-full ${health?.status === 'connected' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {health?.message || 'Probing local target container...'}
            </p>

            <div className="p-3 bg-lab-950 rounded-lg border border-lab-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Host:</span>
                <span className="text-slate-300">{health?.target_url || 'http://127.0.0.1:3000'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">HTTP Response:</span>
                <span className="text-slate-300">{health?.status_code ? `HTTP ${health.status_code}` : 'No response'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Response Latency:</span>
                <span className="text-slate-300">{health?.latency_ms !== undefined ? `${health.latency_ms} ms` : 'N/A'}</span>
              </div>
            </div>

            <div className="pt-2 flex space-x-2">
              {health?.target_url && (
                <a
                  href={health.target_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
                >
                  <span>Open Juice Shop</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => onNavigate('workspace')}
                className="px-3 py-2 rounded-lg bg-lab-800 hover:bg-lab-700 text-slate-200 text-xs font-semibold border border-lab-700 transition-colors"
              >
                Assess
              </button>
            </div>
          </div>

          {/* Quick Lab Actions */}
          <div className="p-4 rounded-xl border border-lab-700 bg-lab-900 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Assessment Workflows</h3>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('remediation')}
                className="w-full p-2.5 rounded-lg border border-lab-800 bg-lab-950 hover:bg-lab-800 text-left flex items-center justify-between group transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 flex items-center space-x-1.5">
                    <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Live Companion Testbed</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Test vulnerable vs patched code directly</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-300" />
              </button>

              <button
                onClick={() => onNavigate('evidence')}
                className="w-full p-2.5 rounded-lg border border-lab-800 bg-lab-950 hover:bg-lab-800 text-left flex items-center justify-between group transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 flex items-center space-x-1.5">
                    <Archive className="w-3.5 h-3.5 text-amber-400" />
                    <span>Evidence Repository</span>
                  </div>
                  <div className="text-[11px] text-slate-500">View captured HTTP logs & screenshots</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-300" />
              </button>

              <button
                onClick={() => onNavigate('retesting')}
                className="w-full p-2.5 rounded-lg border border-lab-800 bg-lab-950 hover:bg-lab-800 text-left flex items-center justify-between group transition-colors"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Retesting & Verification Center</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Audit trail of regression and mitigation tests</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
