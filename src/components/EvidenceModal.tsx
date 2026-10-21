import React from 'react';
import { Evidence } from '../types';
import { X, Calendar, FileText, HardDrive, ShieldCheck, Download } from 'lucide-react';
import { HttpEvidenceViewer } from './HttpEvidenceViewer';

interface Props {
  evidence: Evidence | null;
  onClose: () => void;
}

export const EvidenceModal: React.FC<Props> = ({ evidence, onClose }) => {
  if (!evidence) return null;

  const isImage = evidence.mime_type?.startsWith('image/') ||
    (evidence.filename && /\.(png|jpe?g|webp|gif)$/i.test(evidence.filename));

  const isHttp = evidence.evidence_type === 'HTTP Request' ||
    evidence.evidence_type === 'HTTP Response' ||
    evidence.http_path !== null;

  const fileUrl = evidence.filename ? `/uploads/evidence/${evidence.filename}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-lab-900 border border-lab-700 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-lab-850 border-b border-lab-700">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {evidence.id}
              </span>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                {evidence.evidence_type}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">{evidence.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-lab-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {evidence.description && (
            <div className="p-3 bg-lab-800/60 rounded-lg border border-lab-700 text-sm text-slate-300">
              <span className="font-semibold text-white">Observation: </span>
              {evidence.description}
            </div>
          )}

          {/* Render image preview safely */}
          {isImage && fileUrl && (
            <div className="rounded-lg border border-lab-700 overflow-hidden bg-black/40 flex items-center justify-center p-2">
              <img
                src={fileUrl}
                alt={evidence.title}
                className="max-h-[55vh] object-contain rounded"
              />
            </div>
          )}

          {/* Render HTTP Viewer */}
          {isHttp && (
            <HttpEvidenceViewer
              method={evidence.http_method}
              path={evidence.http_path}
              headers={evidence.http_headers}
              body={evidence.http_body}
              status={evidence.http_status}
              responseHeaders={evidence.http_response_headers}
              responseBody={evidence.http_response_body}
              stage={evidence.test_stage}
            />
          )}

          {/* Fallback text file viewer */}
          {!isImage && !isHttp && evidence.filename && (
            <div className="p-4 bg-lab-950 rounded-lg border border-lab-700 text-center space-y-2">
              <FileText className="w-10 h-10 text-cyan-400 mx-auto" />
              <p className="text-sm text-slate-300">Stored Document: {evidence.original_name || evidence.filename}</p>
              <a
                href={fileUrl || undefined}
                download
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold"
              >
                <Download className="w-4 h-4" />
                <span>Download Artifact</span>
              </a>
            </div>
          )}

          {/* Metadata Footer */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-lab-800 text-xs text-slate-400">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Captured: {new Date(evidence.captured_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <span>Redaction: {evidence.redaction_status}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <HardDrive className="w-4 h-4 text-slate-500" />
              <span>Size: {evidence.file_size ? `${Math.round(evidence.file_size / 1024)} KB` : 'Text artifact'}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Finding: {evidence.finding_id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
