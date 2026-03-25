/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Campeonatos from './pages/Campeonatos';
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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="campeonatos" element={<Campeonatos />} />
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
  );
}
