import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LabSettings } from '../types';
import {
  Settings, Save, RotateCcw, Activity, CheckCircle2,
  HardDrive, AlertTriangle, Download, RefreshCw
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<LabSettings>({});
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [setData, sysData] = await Promise.all([
        api.getSettings(),
        api.getSystemHealth()
      ]);
      setSettings(setData);
      setSystemHealth(sysData);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm('WARNING: This will reset the database back to clean initial seed templates and delete all recorded evidence and retest history. Proceed?')) {
      return;
    }

    setResetting(true);
    try {
      await api.resetDatabase();
      alert('Database successfully reset to initial templates.');
      loadData();
    } catch (err: any) {
      alert('Failed to reset database: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const fullReport = await api.getFullReport();
      const blob = new Blob([JSON.stringify(fullReport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vulnlab-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to export backup: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-2 text-cyan-400" />
        <span>Loading lab settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <span>Lab Configuration & Environment Settings</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure target application endpoints, report authorship metadata, and diagnostic parameters
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleSave} className="p-6 rounded-xl border border-lab-700 bg-lab-900 space-y-5 text-xs shadow-md">
            <div className="flex items-center justify-between border-b border-lab-800 pb-3">
              <h3 className="text-sm font-bold text-white">Target & Assessment Configuration</h3>
              {saveSuccess && (
                <span className="inline-flex items-center text-emerald-400 text-xs font-semibold animate-pulse">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Settings Updated
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Application URL *</label>
                  <input
                    type="text"
                    value={settings.target_url || ''}
                    onChange={(e) => setSettings({ ...settings, target_url: e.target.value })}
                    className="w-full bg-lab-950 border border-lab-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                    required
                  />
                  <span className="text-[11px] text-slate-500">Default: http://127.0.0.1:3000</span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Name & Image</label>
                  <input
                    type="text"
                    value={settings.target_name || ''}
                    onChange={(e) => setSettings({ ...settings, target_name: e.target.value })}
                    className="w-full bg-lab-950 border border-lab-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500">e.g. OWASP Juice Shop</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Version Tag</label>
                  <input
                    type="text"
                    value={settings.target_version || ''}
                    onChange={(e) => setSettings({ ...settings, target_version: e.target.value })}
                    className="w-full bg-lab-950 border border-lab-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Companion Lab Service Endpoint</label>
                  <input
                    type="text"
                    value={settings.companion_url || ''}
                    onChange={(e) => setSettings({ ...settings, companion_url: e.target.value })}
                    className="w-full bg-lab-950 border border-lab-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Academic Report Authorship Metadata */}
            <div className="space-y-3 pt-4 border-t border-lab-800">
              <h3 className="text-sm font-bold text-white">Academic Report & Cover Page Metadata</h3>
              <p className="text-[11px] text-slate-400">
                These values are injected into the final printed report, header metadata, and Markdown export.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Student / Candidate Name</label>
                  <input
                    type="text"
                    value={settings.student_name || ''}
                    onChange={(e) => setSettings({ ...settings, student_name: e.target.value })}
                    className="w-full bg-lab-950 border border-lab-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Roll / Candidate Number</label>
                  <input
                    type="text"
                    value={settings.roll_number || ''}
                    onChange={(e) => setSettings({ ...settings, roll_number: e.target.value })}
                    className="w-full bg-lab-950 border border-lab-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">College / Department</label>
                  <input
                    type="text"
                    value={settings.college_name || ''}
                    onChange={(e) => setSettings({ ...settings, college_name: e.target.value })}
                    className="w-full bg-lab-950 border border-lab-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Faculty Guide Advisor</label>
                  <input
                    type="text"
                    value={settings.guide_name || ''}
                    onChange={(e) => setSettings({ ...settings, guide_name: e.target.value })}
                    className="w-full bg-lab-950 border border-lab-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-lab-800">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Diagnostic Panel & Database Maintenance */}
        <div className="space-y-4">
          {/* Diagnostics Card */}
          <div className="p-5 rounded-xl border border-lab-700 bg-lab-900 space-y-3 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Environment Diagnostics</span>
            </h3>

            <div className="p-3 bg-lab-950 rounded-lg border border-lab-800 space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Node.js Runtime:</span>
                <span className="text-slate-200">{systemHealth?.node_version || 'v24'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Host Platform:</span>
                <span className="text-slate-200">{systemHealth?.platform || 'win32'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Storage Engine:</span>
                <span className="text-slate-200">{systemHealth?.database || 'SQLite WAL'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Catalog Items:</span>
                <span className="text-cyan-400 font-bold">{systemHealth?.findings_loaded || 6} loaded</span>
              </div>
            </div>
          </div>

          {/* Backup & Reset Card */}
          <div className="p-5 rounded-xl border border-lab-700 bg-lab-900 space-y-3 text-xs">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span>Database Operations</span>
            </h3>

            <div className="space-y-2">
              <button
                onClick={handleExportBackup}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-lab-800 hover:bg-lab-700 text-slate-200 border border-lab-700 font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export Full Assessment JSON</span>
              </button>

              <button
                onClick={handleResetDatabase}
                disabled={resetting}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium transition-colors disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span>{resetting ? 'Resetting...' : 'Reset Database to Seed Templates'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Resetting restores all initial templates without deleting project code.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
