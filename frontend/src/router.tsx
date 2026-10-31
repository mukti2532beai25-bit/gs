import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AppShell from './components/layout/AppShell';
import AuthModal from './components/common/AuthModal';
import LoadingScreen from './components/common/LoadingScreen';

// Lazy-load all pages (heavy 3D content)
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CaptureBill = lazy(() => import('./pages/CaptureBill'));
const BillReview = lazy(() => import('./pages/BillReview'));
const WhisperFlow = lazy(() => import('./pages/WhisperFlow'));
const DatabaseArchitect = lazy(() => import('./pages/DatabaseArchitect'));
const ExportCenter = lazy(() => import('./pages/ExportCenter'));

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bv-bg flex items-center justify-center">
        <AuthModal isOpen onClose={() => {}} />
      </div>
    );
  }

  return (
    <AppShell>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="capture" element={<PrivateRoute><CaptureBill /></PrivateRoute>} />
          <Route path="review/:id" element={<PrivateRoute><BillReview /></PrivateRoute>} />
          <Route path="review" element={<PrivateRoute><BillReview /></PrivateRoute>} />
          <Route path="whisperflow" element={<PrivateRoute><WhisperFlow /></PrivateRoute>} />
          <Route path="database" element={<PrivateRoute><DatabaseArchitect /></PrivateRoute>} />
          <Route path="export" element={<PrivateRoute><ExportCenter /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
