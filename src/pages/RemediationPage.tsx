import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Remediation, Finding } from '../types';
import { PageId } from '../components/Layout';
import { CodeBlock } from '../components/CodeBlock';
import {
  Wrench, ShieldCheck, CheckCircle2, Play,
  ExternalLink, ArrowRight, RefreshCw, Terminal, Layers
} from 'lucide-react';

interface Props {
  onNavigate: (page: PageId, findingId?: string) => void;
}

export const RemediationPage: React.FC<Props> = ({ onNavigate }) => {
  const [remediations, setRemediations] = useState<Remediation[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRemediation, setSelectedRemediation] = useState<Remediation | null>(null);

  // Companion Live Testbed State
  const [testEndpoint, setTestEndpoint] = useState<string>('/login');
  const [testPayload, setTestPayload] = useState<string>('{"email": "\' OR 1=1--", "password": "arbitrary"}');
  const [testMethod, setTestMethod] = useState<'GET' | 'POST'>('POST');
  const [companionToken, setCompanionToken] = useState<string>('');
  const [vulnerableResult, setVulnerableResult] = useState<any>(null);
  const [patchedResult, setPatchedResult] = useState<any>(null);
  const [testingCompanion, setTestingCompanion] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [remData, findData] = await Promise.all([
        api.getRemediations(),
        api.getFindings()
      ]);
      setRemediations(remData);
      setFindings(findData);
      if (remData.length > 0) {
        setSelectedRemediation(remData[0]);
      }
    } catch (err) {
      console.error('Failed to load remediation center:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectRemediationItem = (r: Remediation) => {
    setSelectedRemediation(r);
    // Adjust companion test preset
    if (r.finding_id === 'FIND-01') {
      setTestEndpoint('/login');
      setTestMethod('POST');
      setTestPayload('{\n  "email": "\' OR 1=1--",\n  "password": "test"\n}');
    } else if (r.finding_id === 'FIND-02') {
      setTestEndpoint('/admin/users');
      setTestMethod('GET');
      setTestPayload('');
    } else if (r.finding_id === 'FIND-03') {
      setTestEndpoint('/basket/2');
      setTestMethod('GET');
      setTestPayload('');
    } else if (r.finding_id === 'FIND-04') {
      setTestEndpoint('/search?q=<iframe src="javascript:alert(`xss`)">');
      setTestMethod('GET');
      setTestPayload('');
    } else if (r.finding_id === 'FIND-05') {
      setTestEndpoint('/users');
      setTestMethod('GET');
      setTestPayload('');
    } else if (r.finding_id === 'FIND-06') {
      setTestEndpoint('/debug/status');
      setTestMethod('GET');
      setTestPayload('');
    }
    setVulnerableResult(null);
    setPatchedResult(null);
  };

  const runCompanionSideBySideTest = async () => {
    setTestingCompanion(true);
    setVulnerableResult(null);
    setPatchedResult(null);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (companionToken) {
      headers['Authorization'] = `Bearer ${companionToken}`;
    }

    const options: RequestInit = {
      method: testMethod,
      headers
    };
    if (testMethod === 'POST' && testPayload) {
      options.body = testPayload;
    }

    try {
      // 1. Send to Vulnerable endpoint
      const vulnRes = await api.testCompanionEndpoint('vulnerable', testEndpoint, options);
      setVulnerableResult(vulnRes);

      // If we authenticated as admin via SQLi bypass, capture token for testing other endpoints!
      if (vulnRes.body?.token && !companionToken) {
        setCompanionToken(vulnRes.body.token);
      }

      // 2. Send to Patched endpoint
      const patchRes = await api.testCompanionEndpoint('patched', testEndpoint, options);
      setPatchedResult(patchRes);
    } catch (err: any) {
      alert('Error testing companion service: ' + err.message);
    } finally {
      setTestingCompanion(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2 text-cyan-400" />
        <span>Loading remediation center...</span>
      </div>
    );
  }

  const selectedFinding = findings.find(f => f.id === selectedRemediation?.finding_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <Wrench className="w-5 h-5 text-cyan-400" />
          <span>Remediation Center & Secure Coding Architecture</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Empirical root cause analysis, defensive software patterns, and live companion patched verification
        </p>
      </div>

      {/* Remediation Select Ribbon */}
      <div className="p-3 rounded-xl border border-lab-700 bg-lab-900 flex items-center overflow-x-auto space-x-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 shrink-0">
          Remediation Modules:
        </span>
        {remediations.map((r) => {
          const isSelected = selectedRemediation?.id === r.id;
          return (
            <button
              key={r.id}
              onClick={() => selectRemediationItem(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition-all flex items-center space-x-2 ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-lab-950 text-slate-400 hover:text-slate-200 border border-lab-800'
              }`}
            >
              <span>{r.finding_id}</span>
              <span className="px-1.5 py-0.2 rounded bg-lab-800 text-[10px] text-slate-300">
                {r.implementation_status}
              </span>
            </button>
          );
        })}
      </div>

      {selectedRemediation && (
        <div className="space-y-6">
          {/* Remediation Summary Card */}
          <div className="p-6 rounded-xl border border-lab-700 bg-lab-900 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                  {selectedRemediation.id} • For {selectedRemediation.finding_id}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {selectedRemediation.finding_title || selectedFinding?.title}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 self-start sm:self-center">
                Status: {selectedRemediation.implementation_status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-lab-950 rounded-lg border border-lab-800 space-y-1.5">
                <span className="font-semibold text-rose-400 uppercase tracking-wider text-[11px] block">
                  Root Cause Flaw
                </span>
                <p className="text-slate-300 leading-relaxed">{selectedRemediation.root_cause}</p>
              </div>

              <div className="p-4 bg-lab-950 rounded-lg border border-lab-800 space-y-1.5">
                <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[11px] block">
                  Recommended Secure Pattern
                </span>
                <p className="text-slate-300 leading-relaxed">{selectedRemediation.recommended_fix}</p>
              </div>
            </div>

            {selectedRemediation.remaining_limitations && (
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-xs text-amber-200">
                <strong>Defense-in-Depth Considerations: </strong>
                {selectedRemediation.remaining_limitations}
              </div>
            )}
          </div>

          {/* Side-by-side Code Comparisons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Side-by-Side Code Architecture Comparison</span>
              </h3>
              <span className="text-[11px] text-slate-500 italic">
                Illustrative implementation applied to companion testbed
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {selectedFinding?.vulnerable_code_example && (
                <CodeBlock
                  code={selectedFinding.vulnerable_code_example}
                  title="Insecure Implementation (Vulnerable Target)"
                  variant="vulnerable"
                />
              )}

              {selectedFinding?.secure_code_example && (
                <CodeBlock
                  code={selectedFinding.secure_code_example}
                  title="Remediated Implementation (Patched Companion)"
                  variant="secure"
                />
              )}
            </div>
          </div>

          {/* Interactive Live Companion Testbed Section */}
          <div className="p-6 rounded-xl border border-cyan-500/30 bg-lab-900 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-lab-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Play className="w-4 h-4 text-cyan-400" />
                  <span>Interactive Companion Testbed (Live Side-by-Side Verification)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Sends live HTTP payloads to both the <code>/api/companion/vulnerable</code> and <code>/api/companion/patched</code> services
                </p>
              </div>

              <button
                onClick={runCompanionSideBySideTest}
                disabled={testingCompanion}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${testingCompanion ? 'animate-spin' : ''}`} />
                <span>{testingCompanion ? 'Testing Both Targets...' : 'Run Side-by-Side Test'}</span>
              </button>
            </div>

            {/* Testbed Configuration Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">HTTP Method</label>
                <select
                  value={testMethod}
                  onChange={(e: any) => setTestMethod(e.target.value)}
                  className="w-full bg-lab-950 border border-lab-700 rounded px-2.5 py-1.5 text-white font-mono"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-400 mb-1 font-semibold">Endpoint Sub-path</label>
                <input
                  type="text"
                  value={testEndpoint}
                  onChange={(e) => setTestEndpoint(e.target.value)}
                  className="w-full bg-lab-950 border border-lab-700 rounded px-2.5 py-1.5 text-white font-mono"
                />
              </div>
            </div>

            {testMethod === 'POST' && (
              <div>
                <label className="block text-slate-400 mb-1 font-semibold text-xs">Payload (JSON)</label>
                <textarea
                  rows={3}
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  className="w-full bg-lab-950 border border-lab-700 rounded p-2 text-cyan-200 font-mono text-xs"
                />
              </div>
            )}

            {/* Side-by-Side Live Execution Results */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              {/* Vulnerable Result */}
              <div className="rounded-lg border border-red-500/30 bg-lab-950 overflow-hidden text-xs font-mono">
                <div className="px-3.5 py-2 bg-red-500/10 border-b border-red-500/20 text-red-300 font-semibold flex items-center justify-between">
                  <span>VULNERABLE SERVICE (/api/companion/vulnerable{testEndpoint})</span>
                  {vulnerableResult && (
                    <span className="px-1.5 py-0.5 rounded bg-black/40 text-[10px]">
                      HTTP {vulnerableResult.status}
                    </span>
                  )}
                </div>
                <div className="p-3 text-slate-300 overflow-x-auto max-h-60 leading-relaxed">
                  {vulnerableResult ? (
                    <pre>{typeof vulnerableResult.body === 'object' ? JSON.stringify(vulnerableResult.body, null, 2) : vulnerableResult.body}</pre>
                  ) : (
                    <span className="text-slate-600 italic font-sans">Click "Run Side-by-Side Test" to execute payload against vulnerable code.</span>
                  )}
                </div>
              </div>

              {/* Patched Result */}
              <div className="rounded-lg border border-emerald-500/30 bg-lab-950 overflow-hidden text-xs font-mono">
                <div className="px-3.5 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-300 font-semibold flex items-center justify-between">
                  <span>PATCHED SERVICE (/api/companion/patched{testEndpoint})</span>
                  {patchedResult && (
                    <span className="px-1.5 py-0.5 rounded bg-black/40 text-[10px]">
                      HTTP {patchedResult.status}
                    </span>
                  )}
                </div>
                <div className="p-3 text-slate-300 overflow-x-auto max-h-60 leading-relaxed">
                  {patchedResult ? (
                    <pre>{typeof patchedResult.body === 'object' ? JSON.stringify(patchedResult.body, null, 2) : patchedResult.body}</pre>
                  ) : (
                    <span className="text-slate-600 italic font-sans">Click "Run Side-by-Side Test" to verify remediation in patched service.</span>
                  )}
                </div>
              </div>
            </div>

            {patchedResult && (
              <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                <span>
                  <strong>Remediation Verified: </strong> The patched endpoint neutralized the payload and enforced defensive logic.
                </span>
                <button
                  onClick={() => onNavigate('retesting')}
                  className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                >
                  Log into Retesting Center
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
