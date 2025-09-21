import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, Spin } from 'antd';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import './responsive.css';

import Navigation from './components/Navigation';

// Lazy load heavy components for better performance
const ToolHub = React.lazy(() => import('./pages/ToolHub'));
const TicketCreator = React.lazy(() => import('./pages/TicketCreator'));
const ReleaseCreator = React.lazy(() => import('./pages/ReleaseCreator'));
const Settings = React.lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Navigation />
        <Suspense fallback={
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '50vh' 
          }}>
            <Spin size="large" tip="Loading..." />
          </div>
        }>
          <Routes>
            <Route path="/" element={<ToolHub />} />
            <Route path="/ticket-creator" element={<TicketCreator />} />
            <Route path="/release-creator" element={<ReleaseCreator />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
      </Layout>
      <Analytics />
      <SpeedInsights />
    </Router>
  );
}

export default App;
