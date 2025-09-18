import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './views/Dashboard';
import { SeoInsights } from './views/SeoInsights';
import { Settings } from './views/Settings';
import { useWebsite } from './context/WebsiteContext';
import { ConnectWebsite } from './components/ConnectWebsite';

const App: React.FC = () => {
  const { website } = useWebsite();

  if (!website) {
    return <ConnectWebsite />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex w-full flex-col">
        <Header />
        <div className="mx-auto w-full max-w-7xl flex-1">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/seo" element={<SeoInsights />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default App;