import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';

import Login        from '../pages/Login';
import Register     from '../pages/Register';
import Dashboard    from '../pages/Dashboard';
import Leaderboard  from '../pages/Leaderboard';
import Match        from '../pages/Match';
import CreateMatch  from '../pages/CreateMatch';
import Tournament   from '../pages/Tournament';
import TournamentDetails from '../pages/TournamentDetails';
import TournamentPlay from '../pages/TournamentPlay';
import Ledger       from '../pages/Ledger';

const AppRouter = () => (
  <Layout>
    <Routes>
      {/* Public */}
      <Route path="/"          element={<Navigate to="/dashboard" replace />} />
      <Route path="/login"     element={<Login />} />
      <Route path="/register"  element={<Register />} />

      {/* Protected */}
      <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/leaderboard"  element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/match/new"    element={<ProtectedRoute><CreateMatch /></ProtectedRoute>} />
      <Route path="/match/:id"    element={<ProtectedRoute><Match /></ProtectedRoute>} />
      <Route path="/tournament"   element={<ProtectedRoute><Tournament /></ProtectedRoute>} />
      <Route path="/tournaments/:id" element={<ProtectedRoute><TournamentDetails /></ProtectedRoute>} />
      <Route path="/tournaments/:id/play" element={<ProtectedRoute><TournamentPlay /></ProtectedRoute>} />
      <Route path="/ledger"       element={<ProtectedRoute><Ledger /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Layout>
);

export default AppRouter;
