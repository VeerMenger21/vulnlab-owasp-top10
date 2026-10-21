import React, { useState } from 'react';
import {
  ShieldAlert, LayoutDashboard, Shield, Terminal, Archive,
  Wrench, CheckCheck, BookOpen, Settings, Menu, X,
  ExternalLink, AlertTriangle
} from 'lucide-react';
import { TargetHealthBanner } from './TargetHealthBanner';

export type PageId =
  | 'overview'
  | 'catalog'
  | 'finding-detail'
  | 'workspace'
  | 'evidence'
  | 'remediation'
  | 'retesting'
  | 'owasp'
  | 'settings';

interface Props {
  currentPage: PageId;
  onNavigate: (page: PageId, findingId?: string) => void;
  selectedFindingId?: string | null;
  children: React.ReactNode;
}

export const Layout: React.FC<Props> = ({
  currentPage,
  onNavigate,
  selectedFindingId,
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'overview' as PageId, label: 'Overview', icon: LayoutDashboard },
    { id: 'catalog' as PageId, label: 'Vulnerability Catalog', icon: Shield },
    { id: 'workspace' as PageId, label: 'Assessment Workspace', icon: Terminal },
    { id: 'evidence' as PageId, label: 'Evidence Repository', icon: Archive },
    { id: 'remediation' as PageId, label: 'Remediation Center', icon: Wrench },
    { id: 'retesting' as PageId, label: 'Retesting & Verification', icon: CheckCheck },
    { id: 'owasp' as PageId, label: 'OWASP Mapping', icon: BookOpen },
    { id: 'settings' as PageId, label: 'Lab Settings & Config', icon: Settings }
  ];

  const handleNavClick = (pageId: PageId) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-lab-950 text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Scope and Authorized Testing Reminder Banner */}
      <div className="bg-cyan-950/40 border-b border-cyan-800/40 px-4 py-1.5 text-center text-xs text-cyan-300 flex items-center justify-center space-x-2">
        <AlertTriangle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>
          <strong className="text-white">Authorized Local Testing Lab:</strong> Strictly scoped to local OWASP Juice Shop testbed (127.0.0.1:3000) for academic computer engineering research.
        </span>
      </div>

      {/* Target Connectivity Bar */}
      <TargetHealthBanner />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-lab-900 border-r border-lab-800 shrink-0">
          {/* Logo / Branding */}
          <div className="p-4 border-b border-lab-800 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white">VulnLab</h1>
              <p className="text-[11px] text-cyan-400/80 font-mono">OWASP Juice Shop Lab</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id || (item.id === 'catalog' && currentPage === 'finding-detail');
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-lab-800/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-lab-800 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>OWASP Edition:</span>
              <span className="text-slate-400 font-mono">Top 10:2021</span>
            </div>
            <div className="flex justify-between">
              <span>Lab Port:</span>
              <span className="text-slate-400 font-mono">3000 (Target)</span>
            </div>
          </div>
        </aside>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-64 bg-lab-900 border-r border-lab-800 flex flex-col z-10">
              <div className="p-4 border-b border-lab-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-5 h-5 text-cyan-400" />
                  <span className="font-bold text-sm text-white">VulnLab Assessment</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium ${
                        isActive ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Header / Breadcrumb */}
          <header className="h-14 border-b border-lab-800 px-6 flex items-center justify-between bg-lab-900/60 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-lab-800"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Breadcrumb */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500">VulnLab</span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-300 font-medium capitalize">
                  {currentPage.replace('-', ' ')}
                </span>
                {selectedFindingId && currentPage === 'finding-detail' && (
                  <>
                    <span className="text-slate-600">/</span>
                    <span className="text-cyan-400 font-mono font-semibold">
                      {selectedFindingId}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <a
                href="https://owasp.org/www-project-juice-shop/"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-lab-700 bg-lab-800/80 hover:bg-lab-700 text-slate-300 text-xs font-medium transition-colors"
              >
                <span>Juice Shop Docs</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>

              <button
                onClick={() => onNavigate('workspace')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Launch Assessment</span>
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
