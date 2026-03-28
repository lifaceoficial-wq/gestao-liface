/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Campeonatos from './pages/Campeonatos';
import Jogos from './pages/Jogos';
import Equipes from './pages/Equipes';
import Atletas from './pages/Atletas';
import Arbitros from './pages/Arbitros';
import Diretoria from './pages/Diretoria';
import Suspensoes from './pages/Suspensoes';
import Financeiro from './pages/Financeiro';
import Midia from './pages/Midia';
import Historico from './pages/Historico';
import Social from './pages/Social';
import Eventos from './pages/Eventos';
import Relatorios from './pages/Relatorios';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster 
          position="top-right"
          toastOptions={{
            className: 'text-sm font-medium',
            duration: 4000,
            style: { background: '#334155', color: '#fff' },
            success: { duration: 4000, iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { duration: 5000, iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="campeonatos" element={<Campeonatos />} />
            <Route path="jogos" element={<Jogos />} />
            <Route path="equipes" element={<Equipes />} />
            <Route path="atletas" element={<Atletas />} />
            <Route path="arbitros" element={<Arbitros />} />
            <Route path="diretoria" element={<Diretoria />} />
            <Route path="suspensoes" element={<Suspensoes />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="midia" element={<Midia />} />
            <Route path="historico" element={<Historico />} />
            <Route path="social" element={<Social />} />
            <Route path="eventos" element={<Eventos />} />
            <Route path="relatorios" element={<Relatorios />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
