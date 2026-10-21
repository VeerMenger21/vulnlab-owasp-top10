import React, { useState } from 'react';
import { api } from '../services/api';
import { Finding, EvidenceType } from '../types';
import { X, Upload, FileCode, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  findings: Finding[];
  defaultFindingId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const EvidenceUploadModal: React.FC<Props> = ({
  findings,
  defaultFindingId,
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<'file' | 'http'>('file');
  const [findingId, setFindingId] = useState(defaultFindingId || (findings[0]?.id ?? ''));
  const [title, setTitle] = useState('');
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('Screenshot');
  const [description, setDescription] = useState('');
  const [testStage, setTestStage] = useState('Vulnerability Verification');
  const [redacted, setRedacted] = useState(true);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // HTTP capture state
  const [httpMethod, setHttpMethod] = useState('GET');
  const [httpPath, setHttpPath] = useState('/rest/user/login');
  const [httpHeaders, setHttpHeaders] = useState('Host: 127.0.0.1:3000\nContent-Type: application/json');
  const [httpBody, setHttpBody] = useState('{\n  "email": "\' OR 1=1--",\n  "password": "test"\n}');
  const [httpStatus, setHttpStatus] = useState(200);
  const [httpResponseHeaders, setHttpResponseHeaders] = useState('HTTP/1.1 200 OK\nContent-Type: application/json');
  const [httpResponseBody, setHttpResponseBody] = useState('{\n  "status": "success",\n  "authentication": "Bypassed via SQL injection"\n}');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'file') {
        if (!selectedFile) throw new Error('Please select an evidence file to upload.');
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('finding_id', findingId);
        formData.append('title', title || selectedFile.name);
        formData.append('evidence_type', evidenceType);
        formData.append('description', description);
        formData.append('test_stage', testStage);
        formData.append('redaction_status', redacted ? 'Redacted' : 'Unredacted');

        await api.uploadEvidenceFile(formData);
      } else {
        if (!title) throw new Error('Please enter a descriptive title for this HTTP transcript.');
        await api.createHttpEvidence({
          finding_id: findingId,
          title,
          evidence_type: evidenceType === 'Screenshot' ? 'HTTP Request' : evidenceType,
          description,
          test_stage: testStage,
          redaction_status: redacted ? 'Redacted' : 'Unredacted',
          http_method: httpMethod,
          http_path: httpPath,
          http_headers: httpHeaders,
          http_body: httpBody,
          http_status: Number(httpStatus),
          http_response_headers: httpResponseHeaders,
          http_response_body: httpResponseBody
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit evidence.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-lab-900 border border-lab-700 rounded-xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-lab-850 border-b border-lab-700">
          <div>
            <h3 className="text-lg font-bold text-white">Attach Security Assessment Evidence</h3>
            <p className="text-xs text-slate-400">Record genuine screenshots, tool outputs, or HTTP transcripts</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-lab-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-lab-800 bg-lab-950 px-6 pt-3 space-x-4">
          <button
            type="button"
            onClick={() => setMode('file')}
            className={`flex items-center space-x-2 pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              mode === 'file'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Screenshot / File</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('http')}
            className={`flex items-center space-x-2 pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
              mode === 'http'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>HTTP Request / Response Log</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Finding association */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Finding *</label>
              <select
                value={findingId}
                onChange={(e) => setFindingId(e.target.value)}
                className="w-full bg-lab-950 border border-lab-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                required
              >
                {findings.map((f) => (
                  <option key={f.id} value={f.id}>
                    [{f.id}] {f.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Evidence Type *</label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
                className="w-full bg-lab-950 border border-lab-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Screenshot">Screenshot</option>
                <option value="HTTP Request">HTTP Request</option>
                <option value="HTTP Response">HTTP Response</option>
                <option value="Browser Console">Browser Console</option>
                <option value="Tool Output">Tool Output (Burp / ZAP)</option>
                <option value="Remediation Evidence">Remediation Evidence</option>
                <option value="Retest Evidence">Retest Evidence</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Title / Caption *</label>
            <input
              type="text"
              placeholder="e.g. Burp Suite Repeater SQL injection bypass verification"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-lab-950 border border-lab-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Test Stage</label>
              <select
                value={testStage}
                onChange={(e) => setTestStage(e.target.value)}
                className="w-full bg-lab-950 border border-lab-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Initial Reconnaissance">Initial Reconnaissance</option>
                <option value="Vulnerability Verification">Vulnerability Verification</option>
                <option value="Remediation Demonstration">Remediation Demonstration</option>
                <option value="Retesting / Regression">Retesting / Regression</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={redacted}
                  onChange={(e) => setRedacted(e.target.checked)}
                  className="rounded border-lab-700 bg-lab-950 text-cyan-500 focus:ring-0"
                />
                <span>Sensitive tokens & passwords redacted</span>
              </label>
            </div>
          </div>

          {/* Mode 1: File Upload */}
          {mode === 'file' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Select File (PNG, JPG, WEBP, TXT, JSON, PDF) *</label>
              <div className="border-2 border-dashed border-lab-700 hover:border-cyan-500/50 rounded-xl p-6 text-center bg-lab-950 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  accept="image/*,.txt,.json,.md,.pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-200">
                    {selectedFile ? selectedFile.name : 'Click to browse or drag file here'}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-1">Maximum file size: 15MB</p>
                </label>
              </div>
            </div>
          )}

          {/* Mode 2: Manual HTTP Transcript */}
          {mode === 'http' && (
            <div className="space-y-3 pt-2 border-t border-lab-800">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">HTTP Method</label>
                  <select
                    value={httpMethod}
                    onChange={(e) => setHttpMethod(e.target.value)}
                    className="w-full bg-lab-950 border border-lab-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1">Path / URL</label>
                  <input
                    type="text"
                    value={httpPath}
                    onChange={(e) => setHttpPath(e.target.value)}
                    className="w-full bg-lab-950 border border-lab-700 rounded px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Request Payload</label>
                <textarea
                  rows={3}
                  value={httpBody}
                  onChange={(e) => setHttpBody(e.target.value)}
                  className="w-full bg-lab-950 border border-lab-700 rounded p-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">Response Code</label>
                  <input
                    type="number"
                    value={httpStatus}
                    onChange={(e) => setHttpStatus(Number(e.target.value))}
                    className="w-full bg-lab-950 border border-lab-700 rounded px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1">Response Payload</label>
                  <textarea
                    rows={3}
                    value={httpResponseBody}
                    onChange={(e) => setHttpResponseBody(e.target.value)}
                    className="w-full bg-lab-950 border border-lab-700 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Observations & Interpretation</label>
            <textarea
              rows={2}
              placeholder="e.g. Received HTTP 200 with admin JWT token confirming authentication bypass."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-lab-950 border border-lab-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-lab-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-lab-800 hover:bg-lab-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Evidence Artifact'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
