import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Finding, Severity, FindingStatus } from '../types';
import { PageId } from '../components/Layout';
import { StatusBadge } from '../components/StatusBadge';
import { SeverityBadge } from '../components/SeverityBadge';
import {
  Search, Filter, Plus, LayoutGrid, Table as TableIcon,
  Archive, Terminal, ArrowUpDown, ChevronRight, X, ShieldAlert
} from 'lucide-react';

interface Props {
  onNavigate: (page: PageId, findingId?: string) => void;
}

export const CatalogPage: React.FC<Props> = ({ onNavigate }) => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // New Finding Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFinding, setNewFinding] = useState({
    id: 'FIND-07',
    title: '',
    category: 'A07:2021 — Identification and Authentication Failures',
    owasp_id: 'A07:2021',
    severity: 'Medium' as Severity,
    cvss_score: 5.3,
    status: 'Planned' as FindingStatus,
    affected_component: '',
    target_endpoint: '',
    target_method: 'POST',
    hypothesis: '',
    reproduction_steps: '',
    impact: '',
    remediation_summary: ''
  });

  const loadFindings = async () => {
    setLoading(true);
    try {
      const data = await api.getFindings({
        category: categoryFilter || undefined,
        severity: (severityFilter as Severity) || undefined,
        status: (statusFilter as FindingStatus) || undefined,
        search: search || undefined,
        sort: sortBy,
        order: sortOrder
      });
      setFindings(data);
    } catch (err) {
      console.error('Failed to load findings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFindings();
  }, [categoryFilter, severityFilter, statusFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadFindings();
  };

  const handleCreateFinding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createFinding(newFinding);
      setShowAddModal(false);
      loadFindings();
    } catch (err: any) {
      alert('Error creating finding: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <span>Vulnerability Assessment Catalog</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured catalog of planned and verified security testing objectives in OWASP Juice Shop
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View toggle */}
          <div className="bg-lab-900 border border-lab-700 rounded-lg p-0.5 flex">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded ${viewMode === 'cards' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Card grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Table view"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Finding Entry</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-xl border border-lab-700 bg-lab-900 space-y-3 shadow-md">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by vulnerability title, finding ID, endpoint, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-lab-950 border border-lab-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-lab-800 hover:bg-lab-700 border border-lab-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          {/* Category Filter */}
          <div>
            <label className="block text-[11px] text-slate-400 font-semibold mb-1">OWASP Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-lab-950 border border-lab-700 rounded-lg px-2.5 py-1.5 text-slate-200"
            >
              <option value="">All OWASP Categories</option>
              <option value="A01">A01: Broken Access Control</option>
              <option value="A02">A02: Cryptographic Failures</option>
              <option value="A03">A03: Injection</option>
              <option value="A05">A05: Security Misconfiguration</option>
              <option value="A07">A07: Identification Failures</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-[11px] text-slate-400 font-semibold mb-1">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full bg-lab-950 border border-lab-700 rounded-lg px-2.5 py-1.5 text-slate-200"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
              <option value="Informational">Informational</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] text-slate-400 font-semibold mb-1">Assessment Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-lab-950 border border-lab-700 rounded-lg px-2.5 py-1.5 text-slate-200"
            >
              <option value="">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="In Progress">In Progress</option>
              <option value="Verified Vulnerable">Verified Vulnerable</option>
              <option value="Not Reproduced">Not Reproduced</option>
              <option value="Mitigated">Mitigated</option>
              <option value="Retested">Retested</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] text-slate-400 font-semibold mb-1">Sort Ordering</label>
            <div className="flex space-x-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-lab-950 border border-lab-700 rounded-lg px-2.5 py-1.5 text-slate-200"
              >
                <option value="id">Finding ID</option>
                <option value="severity">Severity</option>
                <option value="status">Status</option>
                <option value="cvss_score">CVSS Score</option>
                <option value="updated_at">Updated Date</option>
              </select>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
                className="p-1.5 rounded-lg bg-lab-800 border border-lab-700 text-slate-300 hover:text-white"
                title={`Order: ${sortOrder}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Rendering */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-xs">
          Loading catalog entries...
        </div>
      ) : findings.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-lab-800 bg-lab-900/60 space-y-3">
          <Filter className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No findings match the selected filters</h3>
          <p className="text-xs text-slate-500">Try broadening your search keyword or clearing the filters.</p>
          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('');
              setSeverityFilter('');
              setStatusFilter('');
            }}
            className="px-3 py-1.5 rounded-lg bg-lab-800 text-slate-300 hover:text-white text-xs border border-lab-700"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {findings.map((f) => (
            <div
              key={f.id}
              className="p-5 rounded-xl border border-lab-700 bg-lab-900 hover:border-cyan-500/40 hover:bg-lab-850 transition-all flex flex-col justify-between shadow-md group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                      {f.id}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{f.owasp_id}</span>
                  </div>
                  <SeverityBadge severity={f.severity} score={f.cvss_score} />
                </div>

                <div>
                  <h3
                    onClick={() => onNavigate('finding-detail', f.id)}
                    className="font-bold text-slate-100 group-hover:text-cyan-300 text-sm cursor-pointer transition-colors leading-snug"
                  >
                    {f.title}
                  </h3>
                  <div className="text-xs text-slate-400 mt-1 font-mono bg-lab-950/80 p-1.5 rounded border border-lab-800/80 truncate">
                    {f.target_method || 'GET'} {f.target_endpoint || f.affected_component || 'Application endpoint'}
                  </div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {f.hypothesis || 'Assessment objective to be verified in local target lab.'}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-lab-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <StatusBadge status={f.status} size="sm" />
                  <span className="flex items-center space-x-1 text-slate-400 font-mono text-[11px]">
                    <Archive className="w-3.5 h-3.5 text-slate-500" />
                    <span>{f.evidence_count || 0} evidence</span>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onNavigate('workspace', f.id)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-lab-800 hover:bg-lab-700 text-slate-300 hover:text-white border border-lab-700 transition-colors"
                  >
                    <Terminal className="w-3 h-3 text-cyan-400" />
                    <span>Assess</span>
                  </button>
                  <button
                    onClick={() => onNavigate('finding-detail', f.id)}
                    className="flex items-center space-x-0.5 text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    <span>Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-xl border border-lab-700 bg-lab-900 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-lab-800 border-b border-lab-700 text-[11px] text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Finding Title</th>
                  <th className="px-4 py-3">OWASP Category</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Evidence</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lab-800">
                {findings.map((f) => (
                  <tr key={f.id} className="hover:bg-lab-850/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-cyan-400">{f.id}</td>
                    <td
                      onClick={() => onNavigate('finding-detail', f.id)}
                      className="px-4 py-3 font-semibold text-white hover:text-cyan-300 cursor-pointer max-w-xs truncate"
                    >
                      {f.title}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{f.category}</td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={f.severity} score={f.cvss_score} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={f.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {f.evidence_count || 0} items
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => onNavigate('workspace', f.id)}
                        className="px-2 py-1 rounded bg-lab-800 hover:bg-lab-700 text-slate-200 border border-lab-700"
                      >
                        Assess
                      </button>
                      <button
                        onClick={() => onNavigate('finding-detail', f.id)}
                        className="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Finding Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-lab-900 border border-lab-700 rounded-xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-lab-850 border-b border-lab-700">
              <h3 className="text-base font-bold text-white">Create Custom Finding Template</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateFinding} className="p-6 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Finding ID *</label>
                  <input
                    type="text"
                    value={newFinding.id}
                    onChange={(e) => setNewFinding({ ...newFinding, id: e.target.value })}
                    className="w-full bg-lab-950 border border-lab-700 rounded px-3 py-1.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">OWASP Identifier *</label>
                  <input
                    type="text"
                    value={newFinding.owasp_id}
                    onChange={(e) => setNewFinding({ ...newFinding, owasp_id: e.target.value })}
                    className="w-full bg-lab-950 border border-lab-700 rounded px-3 py-1.5 text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Session Token Manipulation via Predictable Randomness"
                  value={newFinding.title}
                  onChange={(e) => setNewFinding({ ...newFinding, title: e.target.value })}
                  className="w-full bg-lab-950 border border-lab-700 rounded px-3 py-1.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Severity *</label>
                  <select
                    value={newFinding.severity}
                    onChange={(e) => setNewFinding({ ...newFinding, severity: e.target.value as Severity })}
                    className="w-full bg-lab-950 border border-lab-700 rounded px-3 py-1.5 text-white"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                    <option value="Informational">Informational</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Endpoint</label>
                  <input
                    type="text"
                    placeholder="/rest/user/reset-password"
                    value={newFinding.target_endpoint}
                    onChange={(e) => setNewFinding({ ...newFinding, target_endpoint: e.target.value })}
                    className="w-full bg-lab-950 border border-lab-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Security Testing Hypothesis</label>
                <textarea
                  rows={2}
                  placeholder="Describe the hypothesized flaw and test conditions..."
                  value={newFinding.hypothesis}
                  onChange={(e) => setNewFinding({ ...newFinding, hypothesis: e.target.value })}
                  className="w-full bg-lab-950 border border-lab-700 rounded p-2 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-lab-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded bg-lab-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Save Finding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
