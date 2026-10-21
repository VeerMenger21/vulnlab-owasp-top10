import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Evidence, Finding, EvidenceType } from '../types';
import { PageId } from '../components/Layout';
import { EvidenceModal } from '../components/EvidenceModal';
import { EvidenceUploadModal } from '../components/EvidenceUploadModal';
import {
  Archive, Plus, Search, Filter, Trash2, Eye,
  ShieldCheck, Calendar, FileText, HardDrive, RefreshCw
} from 'lucide-react';

interface Props {
  onNavigate: (page: PageId, findingId?: string) => void;
}

export const EvidencePage: React.FC<Props> = ({ onNavigate }) => {
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [findingFilter, setFindingFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [evData, findData] = await Promise.all([
        api.getEvidence(findingFilter || undefined, typeFilter || undefined),
        api.getFindings()
      ]);
      setEvidenceList(evData);
      setFindings(findData);
    } catch (err) {
      console.error('Failed to load evidence data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [findingFilter, typeFilter]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete evidence ${id}?`)) return;

    try {
      await api.deleteEvidence(id);
      loadData();
    } catch (err: any) {
      alert('Failed to delete evidence: ' + err.message);
    }
  };

  const filteredEvidence = evidenceList.filter((ev) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      ev.id.toLowerCase().includes(s) ||
      ev.title.toLowerCase().includes(s) ||
      ev.finding_id.toLowerCase().includes(s) ||
      (ev.description && ev.description.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Archive className="w-5 h-5 text-amber-400" />
            <span>Security Evidence Repository</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Central repository of captured screenshots, HTTP logs, and verification proof with automated token redaction
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Upload New Evidence</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-xl border border-lab-700 bg-lab-900 space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search evidence by ID, title, finding, or observation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-lab-950 border border-lab-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
          <div>
            <label className="block text-[11px] text-slate-400 font-semibold mb-1">Associated Finding</label>
            <select
              value={findingFilter}
              onChange={(e) => setFindingFilter(e.target.value)}
              className="w-full bg-lab-950 border border-lab-700 rounded-lg px-2.5 py-1.5 text-slate-200"
            >
              <option value="">All Findings</option>
              {findings.map((f) => (
                <option key={f.id} value={f.id}>
                  [{f.id}] {f.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-semibold mb-1">Evidence Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-lab-950 border border-lab-700 rounded-lg px-2.5 py-1.5 text-slate-200"
            >
              <option value="">All Types</option>
              <option value="Screenshot">Screenshot</option>
              <option value="HTTP Request">HTTP Request</option>
              <option value="HTTP Response">HTTP Response</option>
              <option value="Browser Console">Browser Console</option>
              <option value="Tool Output">Tool Output</option>
              <option value="Remediation Evidence">Remediation Evidence</option>
              <option value="Retest Evidence">Retest Evidence</option>
            </select>
          </div>
        </div>
      </div>

      {/* Evidence Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
          <span>Loading evidence artifacts...</span>
        </div>
      ) : filteredEvidence.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-dashed border-lab-700 bg-lab-900/60 space-y-3">
          <Archive className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No evidence artifacts found</h3>
          <p className="text-xs text-slate-500">
            {search || findingFilter || typeFilter
              ? 'Try clearing the search query or filters.'
              : 'No evidence artifacts have been captured yet. Upload a screenshot or record an assessment in the workspace.'}
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
          >
            Attach First Evidence Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvidence.map((ev) => {
            const isImage = ev.filename && /\.(png|jpe?g|webp|gif)$/i.test(ev.filename);
            const isHttp = ev.http_path !== null;

            return (
              <div
                key={ev.id}
                onClick={() => setSelectedEvidence(ev)}
                className="rounded-xl border border-lab-700 bg-lab-900 hover:border-cyan-500/40 hover:bg-lab-850 cursor-pointer transition-all flex flex-col justify-between overflow-hidden shadow-md group"
              >
                {/* Media Thumbnail or HTTP Icon Banner */}
                {isImage && ev.filename ? (
                  <div className="h-40 bg-black/40 overflow-hidden relative border-b border-lab-800">
                    <img
                      src={`/uploads/evidence/${ev.filename}`}
                      alt={ev.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-cyan-300 backdrop-blur-sm">
                      Image
                    </div>
                  </div>
                ) : (
                  <div className="h-28 bg-lab-950 p-4 border-b border-lab-800 flex flex-col justify-between font-mono text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.5 rounded bg-lab-800 text-[10px] font-bold text-cyan-400">
                        {ev.http_method || 'HTTP'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {ev.http_status ? `HTTP ${ev.http_status}` : 'Raw Log'}
                      </span>
                    </div>
                    <div className="truncate text-slate-400 text-[11px]">
                      {ev.http_path || 'Evidence Transcript'}
                    </div>
                  </div>
                )}

                {/* Card Body */}
                <div className="p-4 space-y-2 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">{ev.id}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-lab-800 text-slate-300">
                      {ev.evidence_type}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-200 text-sm line-clamp-1 group-hover:text-cyan-300 transition-colors">
                    {ev.title}
                  </h3>

                  {ev.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {ev.description}
                    </p>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-4 py-2.5 bg-lab-950/60 border-t border-lab-800 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-semibold text-slate-400">{ev.finding_id}</span>
                    <span>•</span>
                    <span className="text-emerald-400 flex items-center">
                      <ShieldCheck className="w-3 h-3 mr-0.5" /> {ev.redaction_status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleDelete(ev.id, e)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete evidence"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showUploadModal && (
        <EvidenceUploadModal
          findings={findings}
          defaultFindingId={findingFilter || findings[0]?.id}
          onClose={() => setShowUploadModal(false)}
          onSuccess={loadData}
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
