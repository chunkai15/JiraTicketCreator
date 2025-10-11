import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { MainLayout } from './components/layout/MainLayout';
import { PageTransition } from './components/layout/PageTransition';
import { Spinner } from './components/ui/spinner';
import { ToastProvider } from './components/ui/toast-provider';
import ErrorBoundary from './components/ui/error-boundary';

// Lazy load heavy components for better performance
const ToolHub = React.lazy(() => import('./pages/ToolHub'));
const TicketCreator = React.lazy(() => import('./pages/TicketCreator'));
const ReleaseCreator = React.lazy(() => import('./pages/ReleaseCreator'));
const Settings = React.lazy(() => import('./pages/Settings'));

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ToastProvider>
          <MainLayout>
            <Suspense fallback={
              <div className="flex items-center justify-center h-[50vh]">
                <div className="flex flex-col items-center gap-4">
                  <Spinner size="lg" />
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              </div>
            }>
              <PageTransition>
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<ToolHub />} />
                    <Route path="/ticket-creator" element={<TicketCreator />} />
                    <Route path="/release-creator" element={<ReleaseCreator />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </ErrorBoundary>
              </PageTransition>
            </Suspense>
          </MainLayout>
          <Analytics />
          <SpeedInsights />
        </ToastProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
