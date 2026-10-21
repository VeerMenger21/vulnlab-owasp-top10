import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Retest, Finding } from '../types';
import { PageId } from '../components/Layout';
import {
  CheckCheck, RefreshCw, CheckCircle2, AlertTriangle,
  FileText, ExternalLink, ShieldCheck, Play
} from 'lucide-react';

interface Props {
  onNavigate: (page: PageId, findingId?: string) => void;
}

export const RetestingPage: React.FC<Props> = ({ onNavigate }) => {
  const [retests, setRetests] = useState<Retest[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);

  // New Retest Form Modal
  const [showModal, setShowModal] = useState(false);
  const [findingId, setFindingId] = useState('');
  const [targetTested, setTargetTested] = useState('Companion Patched Target');
  const [methodology, setMethodology] = useState('Manual HTTP verification via API client & Burp Suite');
  const [expectedResult, setExpectedResult] = useState('Payload is neutralized; backend responds with secure status code (HTTP 401/403).');
  const [actualResult, setActualResult] = useState('Verified: Parameterized statement neutralized SQL injection payload and returned HTTP 401.');
  const [outcome, setOutcome] = useState<'Fix Verified' | 'Retest Failed' | 'Partially Mitigated'>('Fix Verified');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [retestData, findingData] = await Promise.all([
        api.getRetests(),
        api.getFindings()
      ]);
      setRetests(retestData);
      setFindings(findingData);
      if (findingData.length > 0 && !findingId) {
        setFindingId(findingData[0].id);
      }
    } catch (err) {
      console.error('Failed to load retesting data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRetest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.recordRetest({
        finding_id: findingId,
        target_tested: targetTested,
        test_methodology: methodology,
        expected_result: expectedResult,
        actual_result: actualResult,
        outcome: outcome,
        notes: notes,
        update_finding_status: true
      });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert('Error recording retest: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2 text-cyan-400" />
        <span>Loading retesting and verification records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <CheckCheck className="w-5 h-5 text-emerald-400" />
            <span>Retesting & Verification Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit trail of empirical regression testing and security verification against patched targets
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Play className="w-4 h-4" />
          <span>Record New Verification Retest</span>
        </button>
      </div>

      {/* Retest Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-lab-700 bg-lab-900 space-y-1">
          <span className="text-slate-400 font-semibold">Total Retest Executions</span>
          <div className="text-2xl font-bold text-white">{retests.length}</div>
          <span className="text-slate-500 text-[11px]">Logged verification attempts</span>
        </div>
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
          <span className="text-emerald-300 font-semibold">Fixes Verified (Pass)</span>
          <div className="text-2xl font-bold text-emerald-400">
            {retests.filter(r => r.outcome === 'Fix Verified').length}
          </div>
          <span className="text-slate-500 text-[11px]">Vulnerabilities successfully neutralized</span>
        </div>
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-1">
          <span className="text-rose-300 font-semibold">Retest Failed (Regression)</span>
          <div className="text-2xl font-bold text-rose-400">
            {retests.filter(r => r.outcome === 'Retest Failed').length}
          </div>
          <span className="text-slate-500 text-[11px]">Still exploitable or incomplete fix</span>
        </div>
      </div>

      {/* Retest Records Table / Cards */}
      {retests.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-lab-700 bg-lab-900/60 space-y-3">
          <CheckCheck className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No retest records exist yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Once you remediate a vulnerability (e.g. testing the Companion Patched Application or patched code), record the verification retest here to promote the finding status.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
          >
            Record First Retest
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {retests.map((rt) => {
            const isVerified = rt.outcome === 'Fix Verified';
            return (
              <div
                key={rt.id}
                className="p-5 rounded-xl border border-lab-700 bg-lab-900 space-y-3 shadow-md hover:border-lab-600 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-lab-800 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                      {rt.id}
                    </span>
                    <button
                      onClick={() => onNavigate('finding-detail', rt.finding_id)}
                      className="font-bold text-white text-sm hover:text-cyan-300 transition-colors"
                    >
                      [{rt.finding_id}] {rt.finding_title || 'Finding Reference'}
                    </button>
                  </div>

                  <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                    isVerified
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  }`}>
                    {rt.outcome}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-lab-950 rounded border border-lab-800 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Target Tested</span>
                    <div className="text-white font-mono font-semibold">{rt.target_tested}</div>
                    <div className="text-slate-500 text-[11px]">Method: {rt.test_methodology}</div>
                  </div>

                  <div className="p-3 bg-lab-950 rounded border border-lab-800 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Observed Behavior</span>
                    <div className="text-slate-200">{rt.actual_result}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                  <span>Retested on: {new Date(rt.retested_at).toLocaleString()}</span>
                  <button
                    onClick={() => onNavigate('finding-detail', rt.finding_id)}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    View Finding Lifecycle →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-lab-900 border border-lab-700 rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-lab-850 border-b border-lab-700">
              <h3 className="text-base font-bold text-white">Record Verification Retest</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateRetest} className="p-6 overflow-y-auto space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Finding *</label>
                <select
                  value={findingId}
                  onChange={(e) => setFindingId(e.target.value)}
                  className="w-full bg-lab-950 border border-lab-700 rounded px-3 py-1.5 text-white"
                  required
                >
                  {findings.map((f) => (
                    <option key={f.id} value={f.id}>
                      [{f.id}] {f.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Tested *</label>
                  <select
                    value={targetTested}
                    onChange={(e) => setTargetTested(e.target.value)}
                    className="w-full bg-lab-950 border border-lab-700 rounded px-3 py-1.5 text-white"
                  >
                    <option value="Companion Patched Target">Companion Patched Application</option>
                    <option value="OWASP Juice Shop Target">OWASP Juice Shop Local Container</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Retest Outcome *</label>
                  <select
                    value={outcome}
                    onChange={(e: any) => setOutcome(e.target.value)}
                    className="w-full bg-lab-950 border border-lab-700 rounded px-3 py-1.5 text-white font-semibold"
                  >
                    <option value="Fix Verified">Fix Verified (Neutralized)</option>
                    <option value="Retest Failed">Retest Failed (Still Vulnerable)</option>
                    <option value="Partially Mitigated">Partially Mitigated</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Methodology</label>
                <input
                  type="text"
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value)}
                  className="w-full bg-lab-950 border border-lab-700 rounded px-3 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Actual Observed Result *</label>
                <textarea
                  rows={3}
                  value={actualResult}
                  onChange={(e) => setActualResult(e.target.value)}
                  className="w-full bg-lab-950 border border-lab-700 rounded p-2 text-white"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-lab-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded bg-lab-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Commit Retest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
