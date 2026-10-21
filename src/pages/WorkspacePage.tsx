import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Finding, FindingStatus } from '../types';
import { PageId } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import { HttpEvidenceViewer } from '../components/HttpEvidenceViewer';
import { EvidenceUploadModal } from '../components/EvidenceUploadModal';
import {
  Terminal, ShieldAlert, CheckCircle2, AlertTriangle,
  Play, ExternalLink, ArrowRight, Save, Upload, Activity, RefreshCw
} from 'lucide-react';

interface Props {
  initialFindingId?: string | null;
  onNavigate: (page: PageId, findingId?: string) => void;
}

export const WorkspacePage: React.FC<Props> = ({ initialFindingId, onNavigate }) => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(true);

  // Workflow assessment form state
  const [testEnvironment, setTestEnvironment] = useState('Localhost Docker Lab (127.0.0.1:3000)');
  const [targetVersion, setTargetVersion] = useState('OWASP Juice Shop v16.0.0');
  const [methodology, setMethodology] = useState('Burp Suite Proxy & Repeater');
  const [outcome, setOutcome] = useState<'Verified Vulnerable' | 'Not Reproduced' | 'Partially Vulnerable'>('Verified Vulnerable');
  const [observations, setObservations] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live HTTP Logger state
  const [httpMethod, setHttpMethod] = useState('POST');
  const [httpPath, setHttpPath] = useState('/rest/user/login');
  const [httpHeaders, setHttpHeaders] = useState('Host: 127.0.0.1:3000\nContent-Type: application/json\nUser-Agent: Mozilla/5.0');
  const [httpBody, setHttpBody] = useState('{\n  "email": "\' OR 1=1--",\n  "password": "test"\n}');
  const [httpStatus, setHttpStatus] = useState(200);
  const [httpResponseHeaders, setHttpResponseHeaders] = useState('HTTP/1.1 200 OK\nContent-Type: application/json\nSet-Cookie: token=[REDACTED]');
  const [httpResponseBody, setHttpResponseBody] = useState('{\n  "status": "success",\n  "data": {\n    "user": { "id": 1, "email": "admin@juice-sh.op", "role": "admin" },\n    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."\n  }\n}');

  const [showUploadModal, setShowUploadModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getFindings();
      setFindings(data);

      const target = initialFindingId
        ? data.find(f => f.id === initialFindingId) || data[0]
        : data[0];

      if (target) {
        selectFinding(target);
      }
    } catch (err) {
      console.error('Failed to load workspace data:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectFinding = (f: Finding) => {
    setSelectedFinding(f);
    setHttpMethod(f.target_method || 'GET');
    setHttpPath(f.target_endpoint || '/');
    setObservations(f.observed_behavior || '');

    // Preset sample payloads based on finding
    if (f.id === 'FIND-01') {
      setHttpMethod('POST');
      setHttpPath('/rest/user/login');
      setHttpBody('{\n  "email": "\' OR 1=1--",\n  "password": "arbitraryPassword"\n}');
      setHttpStatus(200);
      setHttpResponseBody('{\n  "status": "success",\n  "data": {\n    "user": { "id": 1, "email": "admin@juice-sh.op", "role": "admin" },\n    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."\n  }\n}');
    } else if (f.id === 'FIND-02') {
      setHttpMethod('GET');
      setHttpPath('/rest/admin/users');
      setHttpBody('');
      setHttpStatus(200);
      setHttpResponseBody('{\n  "status": "success",\n  "data": [\n    { "id": 1, "email": "admin@juice-sh.op", "role": "admin" },\n    { "id": 2, "email": "jim@juice-sh.op", "role": "customer" }\n  ]\n}');
    } else if (f.id === 'FIND-03') {
      setHttpMethod('GET');
      setHttpPath('/rest/basket/2');
      setHttpBody('');
      setHttpStatus(200);
      setHttpResponseBody('{\n  "status": "success",\n  "data": {\n    "id": 2,\n    "UserId": 2,\n    "Products": [\n      { "id": 2, "name": "Orange Juice (1000ml)", "price": 2.49 }\n    ]\n  }\n}');
    } else if (f.id === 'FIND-04') {
      setHttpMethod('GET');
      setHttpPath('/#/search?q=<iframe src="javascript:alert(`xss`)">');
      setHttpBody('');
      setHttpStatus(200);
      setHttpResponseBody('<!-- DOM Execution in browser context via unescaped search parameter -->');
    } else if (f.id === 'FIND-05') {
      setHttpMethod('GET');
      setHttpPath('/api/Users');
      setHttpBody('');
      setHttpStatus(200);
      setHttpResponseBody('[\n  {\n    "id": 1,\n    "email": "admin@juice-sh.op",\n    "password": "0192023a7bbd73250516f069df18b500",\n    "totpSecret": "JBSWY3DPEHPK3PXP"\n  }\n]');
    } else if (f.id === 'FIND-06') {
      setHttpMethod('GET');
      setHttpPath('/api-docs');
      setHttpBody('');
      setHttpStatus(200);
      setHttpResponseBody('{"swagger": "2.0", "info": { "title": "Juice Shop Internal API Documentation" }}');
    }
  };

  useEffect(() => {
    loadData();
  }, [initialFindingId]);

  const handleRecordAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      // 1. Record the assessment
      await api.recordAssessment({
        finding_id: selectedFinding.id,
        target_version: targetVersion,
        test_environment: testEnvironment,
        methodology: methodology,
        outcome: outcome,
        observations: observations,
        update_finding_status: true
      });

      // 2. Also log the HTTP transcript as an evidence artifact
      await api.createHttpEvidence({
        finding_id: selectedFinding.id,
        title: `${selectedFinding.id} - ${outcome} HTTP Evidence Transcript`,
        evidence_type: 'HTTP Request',
        description: observations,
        test_stage: 'Vulnerability Verification',
        redaction_status: 'Redacted',
        http_method: httpMethod,
        http_path: httpPath,
        http_headers: httpHeaders,
        http_body: httpBody,
        http_status: Number(httpStatus),
        http_response_headers: httpResponseHeaders,
        http_response_body: httpResponseBody
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      // Reload findings
      const updated = await api.getFinding(selectedFinding.id);
      setSelectedFinding(updated);
    } catch (err: any) {
      alert('Error recording assessment: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2 text-cyan-400" />
        <span>Loading assessment workspace...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <span>Security Assessment Execution Workspace</span>
          </h2>
          <p className="text-xs text-slate-400">
            Guided reproduction, HTTP proxy traffic capture, controlled verification, and evidence persistence
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href="http://127.0.0.1:3000"
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-lab-800 hover:bg-lab-700 text-slate-200 text-xs font-semibold border border-lab-700 transition-colors"
          >
            <span>Launch Target (3000)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Screenshot</span>
          </button>
        </div>
      </div>

      {/* Target Selector Ribbon */}
      <div className="p-3 rounded-xl border border-lab-700 bg-lab-900 flex items-center overflow-x-auto space-x-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 shrink-0">
          Target Objective:
        </span>
        {findings.map((f) => {
          const isSelected = selectedFinding?.id === f.id;
          return (
            <button
              key={f.id}
              onClick={() => selectFinding(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition-all flex items-center space-x-2 ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-lab-950 text-slate-400 hover:text-slate-200 border border-lab-800'
              }`}
            >
              <span>{f.id}</span>
              <span className="text-[10px] text-slate-400">({f.owasp_id})</span>
            </button>
          );
        })}
      </div>

      {selectedFinding && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Finding Guide & Investigation Steps */}
          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-lab-700 bg-lab-900 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-400">{selectedFinding.id}</span>
                <StatusBadge status={selectedFinding.status} size="sm" />
              </div>
              <h3 className="font-bold text-white text-base leading-snug">{selectedFinding.title}</h3>
              <div className="text-xs text-slate-400 font-mono bg-lab-950 p-2 rounded border border-lab-800 truncate">
                {selectedFinding.target_method || 'GET'} {selectedFinding.target_endpoint}
              </div>
              <div className="text-xs text-slate-300 leading-relaxed">
                <span className="font-semibold text-white block mb-1">Security Hypothesis:</span>
                {selectedFinding.hypothesis}
              </div>
            </div>

            {/* Reproduction Instructions */}
            <div className="p-5 rounded-xl border border-lab-700 bg-lab-900 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Controlled Lab Procedure</span>
              </h4>
              <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-mono p-3 bg-lab-950 rounded border border-lab-800">
                {selectedFinding.reproduction_steps}
              </div>

              <div className="pt-2 text-xs space-y-2">
                <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  <strong>Expected Secure Behavior: </strong>
                  {selectedFinding.expected_behavior}
                </div>
              </div>
            </div>

            {/* Burp Suite & Tool Guidance */}
            <div className="p-4 rounded-xl border border-lab-700 bg-lab-900 space-y-2 text-xs text-slate-400">
              <span className="font-bold text-white uppercase text-[11px] tracking-wider block">
                Testing Tools Advice
              </span>
              <ul className="list-disc list-inside space-y-1">
                <li>Configure Burp Suite Proxy listener on 127.0.0.1:8080.</li>
                <li>Forward request to Repeater tab (Ctrl+R) for testing payloads.</li>
                <li>Ensure passwords and tokens are redacted before saving evidence.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Execution Form & Evidence Logging */}
          <div className="lg:col-span-2 space-y-4">
            <form onSubmit={handleRecordAssessment} className="p-5 rounded-xl border border-lab-700 bg-lab-900 space-y-4 text-xs shadow-md">
              <div className="flex items-center justify-between border-b border-lab-800 pb-3">
                <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                  <Play className="w-4 h-4 text-cyan-400" />
                  <span>Record Controlled Assessment Results</span>
                </h3>
                {saveSuccess && (
                  <span className="inline-flex items-center text-emerald-400 text-xs font-semibold animate-pulse">
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Assessment & Evidence Logged!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Version</label>
                  <input
                    type="text"
                    value={targetVersion}
                    onChange={(e) => setTargetVersion(e.target.value)}
                    className="w-full bg-lab-950 border border-lab-700 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Testing Methodology</label>
                  <select
                    value={methodology}
                    onChange={(e) => setMethodology(e.target.value)}
                    className="w-full bg-lab-950 border border-lab-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="Burp Suite Proxy & Repeater">Burp Suite Proxy & Repeater</option>
                    <option value="Browser DevTools Network Tab">Browser DevTools Network Tab</option>
                    <option value="OWASP ZAP Intercepting Proxy">OWASP ZAP Intercepting Proxy</option>
                    <option value="Manual cURL / HTTP Client">Manual cURL / HTTP Client</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Observed Outcome *</label>
                  <select
                    value={outcome}
                    onChange={(e: any) => setOutcome(e.target.value)}
                    className="w-full bg-lab-950 border border-lab-700 rounded px-2.5 py-1.5 text-white font-semibold"
                  >
                    <option value="Verified Vulnerable">Verified Vulnerable (Success)</option>
                    <option value="Not Reproduced">Not Reproduced (Exploit Failed)</option>
                    <option value="Partially Vulnerable">Partially Vulnerable</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Observations & Impact Assessment *</label>
                <textarea
                  rows={3}
                  placeholder="Document the exact technical behavior observed, error messages, and verified bypass..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full bg-lab-950 border border-lab-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              {/* Interactive HTTP Request / Response Transcript Logger */}
              <div className="space-y-3 pt-3 border-t border-lab-800">
                <span className="font-bold text-slate-200 block text-xs uppercase tracking-wider">
                  HTTP Evidence Transcript to Persist
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1">Method</label>
                    <select
                      value={httpMethod}
                      onChange={(e) => setHttpMethod(e.target.value)}
                      className="w-full bg-lab-950 border border-lab-700 rounded px-2 py-1.5 text-white font-mono"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-slate-400 mb-1">Path / URL</label>
                    <input
                      type="text"
                      value={httpPath}
                      onChange={(e) => setHttpPath(e.target.value)}
                      className="w-full bg-lab-950 border border-lab-700 rounded px-2 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Request Body (Payload)</label>
                    <textarea
                      rows={5}
                      value={httpBody}
                      onChange={(e) => setHttpBody(e.target.value)}
                      className="w-full bg-lab-950 border border-lab-700 rounded p-2 text-cyan-200 font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Response Body (HTTP {httpStatus})</label>
                    <textarea
                      rows={5}
                      value={httpResponseBody}
                      onChange={(e) => setHttpResponseBody(e.target.value)}
                      className="w-full bg-lab-950 border border-lab-700 rounded p-2 text-slate-200 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-lab-800">
                <button
                  type="button"
                  onClick={() => onNavigate('finding-detail', selectedFinding.id)}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  View Full Finding Details & Remediations
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Recording...' : 'Commit Assessment & Evidence'}</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Live Preview of how the HTTP evidence renders */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Evidence Transcript Safe Render Preview
              </span>
              <HttpEvidenceViewer
                method={httpMethod}
                path={httpPath}
                headers={httpHeaders}
                body={httpBody}
                status={httpStatus}
                responseHeaders={httpResponseHeaders}
                responseBody={httpResponseBody}
                notes={observations}
                stage="Vulnerability Verification"
              />
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && selectedFinding && (
        <EvidenceUploadModal
          findings={findings}
          defaultFindingId={selectedFinding.id}
          onClose={() => setShowUploadModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};
