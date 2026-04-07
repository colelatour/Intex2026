// src/App.tsx
import { Routes, Route } from 'react-router-dom';

import Navbar          from './components/layout/Navbar';
import ProtectedRoute  from './components/ProtectedRoute';
import CookieConsent   from './components/CookieConsent';
import Home            from './pages/Home';
import Donate          from './pages/Donate';
import Admin           from './pages/Admin';
import Login           from './pages/Login';
import ImpactDashboard from './pages/ImpactDashboard';
import RegionsPage     from './pages/RegionsPage';
import PrivacyPolicy   from './pages/PrivacyPolicy';
import Account         from './pages/Account';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"        element={<Home />} />
        <Route path="/login"   element={<Login />} />
        <Route path="/impact"  element={<ImpactDashboard />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/regions" element={<RegionsPage />} />
        <Route path="/account" element={<Account />} />
        <Route path="/donate"  element={<Donate />} />
        <Route path="/admin"   element={
          <ProtectedRoute requiredRoles={["Admin"]}>
            <Admin />
          </ProtectedRoute>
        } />
      </Routes>
      <CookieConsent />
    </>
  );
}
