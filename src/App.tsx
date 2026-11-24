import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from './lib/i18n';
import { AuthProvider } from './context/AuthContext';
import { QueueProvider } from './context/QueueContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { GetTokenPage } from './pages/GetTokenPage';
import { MyTokenPage } from './pages/MyTokenPage';
import { ReceptionPage } from './pages/ReceptionPage';
import { BarberPage } from './pages/BarberPage';
import { TvPage } from './pages/TvPage';
import { OwnerPage } from './pages/OwnerPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <AuthProvider>
          <QueueProvider>
            <BrowserRouter>
              <Routes>
                {/* Public customer routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/token" element={<GetTokenPage />} />
                <Route path="/t/:id" element={<MyTokenPage />} />

                {/* Public waiting room display */}
                <Route path="/tv" element={<TvPage />} />

                {/* Staff authentication */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Staff Routes */}
                <Route
                  path="/reception"
                  element={
                    <ProtectedRoute allowedRoles={['receptionist', 'owner']}>
                      <ReceptionPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/barber/:name"
                  element={
                    <ProtectedRoute allowedRoles={['barber', 'owner']}>
                      <BarberPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/owner"
                  element={
                    <ProtectedRoute allowedRoles={['owner']}>
                      <OwnerPage />
                    </ProtectedRoute>
                  }
                />

                {/* 404 handler */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
          </QueueProvider>
        </AuthProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
};

export default App;
