import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CaseDetails from './pages/CaseDetails';
import NewAnalysis from './pages/NewAnalysis';
import CasesArchive from './pages/CasesArchive';
import Layout from './components/Layout';

// Simple token-based auth guard
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('fx_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"   element={<Dashboard />} />
          <Route path="analyze"     element={<NewAnalysis />} />
          <Route path="cases"       element={<CasesArchive />} />
          <Route path="case/:id"    element={<CaseDetails />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
