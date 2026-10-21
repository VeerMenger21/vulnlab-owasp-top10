import React, { useState } from 'react';
import { Layout, PageId } from './components/Layout';
import { OverviewPage } from './pages/OverviewPage';
import { CatalogPage } from './pages/CatalogPage';
import { FindingDetailPage } from './pages/FindingDetailPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { EvidencePage } from './pages/EvidencePage';
import { RemediationPage } from './pages/RemediationPage';
import { RetestingPage } from './pages/RetestingPage';
import { OwaspMappingPage } from './pages/OwaspMappingPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>('FIND-01');

  const handleNavigate = (page: PageId, findingId?: string) => {
    if (findingId) {
      setSelectedFindingId(findingId);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <OverviewPage onNavigate={handleNavigate} />;
      case 'catalog':
        return <CatalogPage onNavigate={handleNavigate} />;
      case 'finding-detail':
        return (
          <FindingDetailPage
            findingId={selectedFindingId || 'FIND-01'}
            onNavigate={handleNavigate}
          />
        );
      case 'workspace':
        return (
          <WorkspacePage
            initialFindingId={selectedFindingId}
            onNavigate={handleNavigate}
          />
        );
      case 'evidence':
        return <EvidencePage onNavigate={handleNavigate} />;
      case 'remediation':
        return <RemediationPage onNavigate={handleNavigate} />;
      case 'retesting':
        return <RetestingPage onNavigate={handleNavigate} />;
      case 'owasp':
        return <OwaspMappingPage onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      selectedFindingId={selectedFindingId}
    >
      {renderPage()}
    </Layout>
  );
};

export default App;
