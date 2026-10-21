import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Finding, Evidence, Remediation, Retest, FindingStatus, Severity } from '../types';
import { PageId } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { CodeBlock } from '../components/CodeBlock';
import { HttpEvidenceViewer } from '../components/HttpEvidenceViewer';
import { EvidenceUploadModal } from '../components/EvidenceUploadModal';
import { EvidenceModal } from '../components/EvidenceModal';
import {
  ArrowLeft, Terminal, ShieldAlert, CheckCircle2,
  AlertTriangle, Archive, Wrench, RefreshCw, BookOpen,
  Plus, ExternalLink, Activity, Info
} from 'lucide-react';

interface Props {
  findingId: string;
  onNavigate: (page: PageId, findingId?: string) => void;
}

export const FindingDetailPage: React.FC<Props> = ({ findingId, onNavigate }) => {
  const [finding, setFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reproduction' | 'evidence' | 'impact' | 'remediation' | 'retesting' | 'references'>('overview');

  // Evidence modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);

  // Retest form state
  const [showRetestForm, setShowRetestForm] = useState(false);
  const [retestTarget, setRetestTarget] = useState<'Companion Patched Target' | 'OWASP Juice Shop Target'>('Companion Patched Target');
  const [retestMethodology, setRetestMethodology] = useState('Manual HTTP verification via Burp Suite & API client');
  const [retestExpected, setRetestExpected] = useState('Application rejects injection payload and returns secure HTTP 401 Unauthorized / 403 Forbidden.');
  const [retestActual, setRetestActual] = useState('Injection payload neutralized; secure parameterized statement returned HTTP 401 Invalid Credentials.');
  const [retestOutcome, setRetestOutcome] = useState<'Fix Verified' | 'Retest Failed' | 'Partially Mitigated'>('Fix Verified');
  const [retestNotes, setRetestNotes] = useState('');

  // Status edit state
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<FindingStatus>('Planned');
  const [newObservedBehavior, setNewObservedBehavior] = useState('');

  const loadFinding = async () => {
    setLoading(true);
    try {
      const data = await api.getFinding(findingId);
      setFinding(data);
      setNewStatus(data.status);
      setNewObservedBehavior(data.observed_behavior || '');
    } catch (err) {
      console.error('Failed to load finding details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinding();
  }, [findingId]);

  const handleStatusUpdate = async () => {
    if (!finding) return;
    try {
      await api.updateFinding(finding.id, {
        status: newStatus,
        observed_behavior: newObservedBehavior
      });
      setEditingStatus(false);
      loadFinding();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleRecordRetest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finding) return;
    try {
      await api.recordRetest({
        finding_id: finding.id,
        remediation_id: finding.remediation?.id || null,
        target_tested: retestTarget,
        test_methodology: retestMethodology,
        expected_result: retestExpected,
        actual_result: retestActual,
        outcome: retestOutcome,
        notes: retestNotes,
        update_finding_status: true
      });
      setShowRetestForm(false);
      loadFinding();
    } catch (err: any) {
      alert('Failed to record retest: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2 text-cyan-400" />
        <span>Loading finding details...</span>
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="p-8 text-center bg-lab-900 border border-lab-800 rounded-xl space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Finding Not Found</h3>
        <p className="text-xs text-slate-400">The requested finding ID ({findingId}) does not exist in the database.</p>
        <button
          onClick={() => onNavigate('catalog')}
          className="px-3 py-1.5 rounded-lg bg-cyan-600 text-white text-xs font-semibold"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '1. Overview' },
    { id: 'reproduction', label: '2. Reproduction' },
    { id: 'evidence', label: `3. Technical Evidence (${finding.evidence?.length || 0})` },
    { id: 'impact', label: '4. Impact Analysis' },
    { id: 'remediation', label: '5. Remediation' },
    { id: 'retesting', label: `6. Retesting (${finding.retests?.length || 0})` },
    { id: 'references', label: '7. References' }
  ];

  return (
    <div className="space-y-6">
      {/* Back button and quick actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('catalog')}
          className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Vulnerability Catalog</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('workspace', finding.id)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Open in Assessment Workspace</span>
          </button>
        </div>
      </div>

      {/* Main Finding Banner */}
      <div className="p-6 rounded-xl border border-lab-700 bg-lab-900 space-y-4 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {finding.id}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {finding.owasp_id} ({finding.owasp_edition})
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-300">{finding.category}</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">{finding.title}</h1>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <SeverityBadge severity={finding.severity} score={finding.cvss_score} />
            <StatusBadge status={finding.status} />
          </div>
        </div>

        {/* Target Component Strip */}
        <div className="p-3 bg-lab-950 rounded-lg border border-lab-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Component:</span>
            <span className="text-slate-300">{finding.affected_component || 'Application Endpoint'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Target Endpoint:</span>
            <span className="px-1.5 py-0.5 rounded bg-lab-800 text-cyan-300">
              {finding.target_method || 'GET'} {finding.target_endpoint}
            </span>
          </div>
        </div>

        {/* Status Editing Accordion */}
        <div className="pt-2 border-t border-lab-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Current Assessment State: <strong className="text-white">{finding.status}</strong>
          </span>
          <button
            onClick={() => setEditingStatus(!editingStatus)}
            className="text-cyan-400 hover:text-cyan-300 font-medium"
          >
            {editingStatus ? 'Cancel Edit' : 'Change Assessment Status'}
          </button>
        </div>

        {editingStatus && (
          <div className="p-4 rounded-lg bg-lab-950 border border-lab-700 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Update Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as FindingStatus)}
                  className="w-full bg-lab-900 border border-lab-700 rounded px-3 py-1.5 text-white"
                >
                  <option value="Planned">Planned (Awaiting lab execution)</option>
                  <option value="In Progress">In Progress (Currently evaluating)</option>
                  <option value="Verified Vulnerable">Verified Vulnerable (Confirmed via evidence)</option>
                  <option value="Not Reproduced">Not Reproduced (Test failed to exploit)</option>
                  <option value="Mitigated">Mitigated (Remediation proposed / built)</option>
                  <option value="Retested">Retested (Fix verified in retest)</option>
                  <option value="Closed">Closed (Assessment finalized)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Observed Behavior Notes</label>
                <input
                  type="text"
                  placeholder="Record actual result observed in local lab..."
                  value={newObservedBehavior}
                  onChange={(e) => setNewObservedBehavior(e.target.value)}
                  className="w-full bg-lab-900 border border-lab-700 rounded px-3 py-1.5 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditingStatus(false)}
                className="px-3 py-1 rounded bg-lab-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                className="px-4 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
              >
                Save Status
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Header */}
      <div className="border-b border-lab-800 flex overflow-x-auto space-x-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-lab-900/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-lab-700 bg-lab-900 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Security Hypothesis & Background</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {finding.hypothesis || 'Assessment objective to be verified in local target lab.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-lab-700 bg-lab-900 space-y-3">
              <h3 className="text-sm font-bold text-white">Preconditions & Lab Setup</h3>
              <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                {finding.prerequisites || 'Target application running on http://127.0.0.1:3000'}
              </div>
            </div>

            <div className="p-5 rounded-xl border border-lab-700 bg-lab-900 space-y-3">
              <h3 className="text-sm font-bold text-white">CVSS Risk Profile</h3>
              <div className="p-3 bg-lab-950 rounded border border-lab-800 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">CVSS v3.1 Base Score:</span>
                  <span className="text-white font-bold">{finding.cvss_score || 'N/A'} ({finding.severity})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vector String:</span>
                  <span className="text-cyan-400 truncate max-w-xs">{finding.cvss_vector || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Attack Vector:</span>
                  <span className="text-slate-300">Network (AV:N)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">User Interaction:</span>
                  <span className="text-slate-300">{finding.severity === 'Critical' ? 'None (UI:N)' : 'Required / None'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Reproduction */}
      {activeTab === 'reproduction' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-lab-700 bg-lab-900 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Step-by-Step Reproduction Procedure</span>
            </h3>
            <div className="p-3.5 bg-lab-950 rounded-lg border border-lab-800 text-xs text-slate-200 whitespace-pre-line leading-relaxed font-mono">
              {finding.reproduction_steps || '1. Open target endpoint in browser or proxy\n2. Send testing payload\n3. Observe server response'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-lab-700 bg-lab-900 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Expected Secure Behavior</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {finding.expected_behavior || 'Application properly rejects unauthorized input and enforces defensive policies.'}
              </p>
            </div>

            <div className="p-5 rounded-xl border border-lab-700 bg-lab-900 space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400">Observed Laboratory Behavior</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {finding.observed_behavior || 'Awaiting lab execution.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Technical Evidence */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Associated Evidence Artifacts</h3>
              <p className="text-xs text-slate-400">Captured HTTP transcripts, screenshots, and terminal outputs</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Attach Evidence</span>
            </button>
          </div>

          {finding.evidence && finding.evidence.length > 0 ? (
            <div className="space-y-4">
              {finding.evidence.map((ev) => (
                <div key={ev.id} className="p-4 rounded-xl border border-lab-700 bg-lab-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">{ev.id}</span>
                      <span className="text-xs font-semibold text-white">{ev.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-lab-800 text-slate-300">
                        {ev.evidence_type}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedEvidence(ev)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      Inspect Evidence
                    </button>
                  </div>

                  {ev.description && (
                    <p className="text-xs text-slate-300">{ev.description}</p>
                  )}

                  {/* Inline HTTP viewer if it contains request/response details */}
                  {ev.http_path && (
                    <HttpEvidenceViewer
                      method={ev.http_method}
                      path={ev.http_path}
                      headers={ev.http_headers}
                      body={ev.http_body}
                      status={ev.http_status}
                      responseHeaders={ev.http_response_headers}
                      responseBody={ev.http_response_body}
                      stage={ev.test_stage}
                    />
                  )}

                  {/* Inline thumbnail if image */}
                  {ev.filename && /\.(png|jpe?g|webp)$/i.test(ev.filename) && (
                    <div
                      onClick={() => setSelectedEvidence(ev)}
                      className="cursor-pointer max-w-sm rounded border border-lab-800 overflow-hidden hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={`/uploads/evidence/${ev.filename}`}
                        alt={ev.title}
                        className="max-h-48 object-cover w-full"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl border border-dashed border-lab-700 bg-lab-950 space-y-2">
              <Archive className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No evidence artifacts recorded yet for this finding.</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-lab-800 hover:bg-lab-700 text-slate-200 text-xs font-semibold border border-lab-700"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Add First Evidence Artifact</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Impact Analysis */}
      {activeTab === 'impact' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-lab-700 bg-lab-900 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Potential Security Impact</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {finding.impact || 'Full exposure of confidential records, privilege escalation, or unauthorized access.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-lab-700 bg-lab-900 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Confidentiality</span>
              <div className="text-base font-bold text-white">High</div>
              <p className="text-slate-400 text-[11px]">Direct compromise of private customer data or credential storage.</p>
            </div>
            <div className="p-4 rounded-xl border border-lab-700 bg-lab-900 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Integrity</span>
              <div className="text-base font-bold text-white">High / Moderate</div>
              <p className="text-slate-400 text-[11px]">Potential unauthorized state modification, account modification or order tampering.</p>
            </div>
            <div className="p-4 rounded-xl border border-lab-700 bg-lab-900 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Availability</span>
              <div className="text-base font-bold text-white">Low</div>
              <p className="text-slate-400 text-[11px]">Primary attack path targets data access rather than Denial of Service.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Remediation */}
      {activeTab === 'remediation' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl border border-lab-700 bg-lab-900 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-cyan-400" />
              <span>Remediation Strategy & Root Cause</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {finding.remediation_summary || 'Apply safe parameterization, authorization checks, and contextual output encoding.'}
            </p>
          </div>

          <div className="space-y-4">
            {finding.vulnerable_code_example && (
              <CodeBlock
                code={finding.vulnerable_code_example}
                title="Vulnerable Implementation (Root Cause)"
                variant="vulnerable"
              />
            )}

            {finding.secure_code_example && (
              <CodeBlock
                code={finding.secure_code_example}
                title="Secure Remediation (Safe Implementation Pattern)"
                variant="secure"
              />
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Retesting */}
      {activeTab === 'retesting' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Retesting & Verification Records</h3>
              <p className="text-xs text-slate-400">Post-remediation verification results against target or companion application</p>
            </div>
            <button
              onClick={() => setShowRetestForm(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Record New Retest</span>
            </button>
          </div>

          {showRetestForm && (
            <form onSubmit={handleRecordRetest} className="p-5 rounded-xl border border-lab-700 bg-lab-950 space-y-3.5 text-xs shadow-lg">
              <h4 className="font-bold text-white text-sm">Record Verification Retest</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Application Tested *</label>
                  <select
                    value={retestTarget}
                    onChange={(e: any) => setRetestTarget(e.target.value)}
                    className="w-full bg-lab-900 border border-lab-700 rounded px-3 py-1.5 text-white"
                  >
                    <option value="Companion Patched Target">Companion Patched Application (Port 5000)</option>
                    <option value="OWASP Juice Shop Target">OWASP Juice Shop Target (Port 3000)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Retest Outcome *</label>
                  <select
                    value={retestOutcome}
                    onChange={(e: any) => setRetestOutcome(e.target.value)}
                    className="w-full bg-lab-900 border border-lab-700 rounded px-3 py-1.5 text-white"
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
                  value={retestMethodology}
                  onChange={(e) => setRetestMethodology(e.target.value)}
                  className="w-full bg-lab-900 border border-lab-700 rounded px-3 py-1.5 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Expected Secure Behavior</label>
                  <textarea
                    rows={2}
                    value={retestExpected}
                    onChange={(e) => setRetestExpected(e.target.value)}
                    className="w-full bg-lab-900 border border-lab-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Actual Observed Behavior</label>
                  <textarea
                    rows={2}
                    value={retestActual}
                    onChange={(e) => setRetestActual(e.target.value)}
                    className="w-full bg-lab-900 border border-lab-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-lab-800">
                <button
                  type="button"
                  onClick={() => setShowRetestForm(false)}
                  className="px-3 py-1.5 rounded bg-lab-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Save Retest Result
                </button>
              </div>
            </form>
          )}

          {finding.retests && finding.retests.length > 0 ? (
            <div className="space-y-3">
              {finding.retests.map((rt) => (
                <div key={rt.id} className="p-4 rounded-xl border border-lab-700 bg-lab-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">{rt.id}</span>
                      <span className="text-xs text-slate-400">• Tested: {rt.target_tested}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      rt.outcome === 'Fix Verified' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {rt.outcome}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-white">Actual Result: </span>
                    {rt.actual_result}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Methodology: {rt.test_methodology} | Date: {new Date(rt.retested_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl border border-dashed border-lab-700 bg-lab-950 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No retest records exist yet. Remediate and verify to record a retest.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 7: References */}
      {activeTab === 'references' && (
        <div className="p-5 rounded-xl border border-lab-700 bg-lab-900 space-y-3 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Official Standards & References</span>
          </h3>
          <ul className="space-y-2">
            {finding.references_list.map((ref, idx) => (
              <li key={idx}>
                <a
                  href={ref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 hover:underline break-all"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span>{ref}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modals */}
      {showUploadModal && (
        <EvidenceUploadModal
          findings={[finding]}
          defaultFindingId={finding.id}
          onClose={() => setShowUploadModal(false)}
          onSuccess={loadFinding}
        />
      )}

      {selectedEvidence && (
        <EvidenceModal
          evidence={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
        />
      )}
    </div>
  );
};
