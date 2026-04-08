// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import CookieConsent from './components/CookieConsent';
import Home from './pages/Home';
import Donate from './pages/Donate';
import AdminLayout, {
  AdminDashboard,
  AdminResidentDirectory,
  AdminDonors,
  AdminProcessRecordings,
  AdminSafehouseManagement,
  AdminUserManagement,
  AdminHomeVisits,
  AdminCatchAll,
} from './pages/Admin';
import Login from './pages/Login';
import ImpactDashboard from './pages/ImpactDashboard';
import RegionsPage from './pages/RegionsPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Account from './pages/Account';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/impact" element={<ImpactDashboard />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/regions" element={<RegionsPage />} />
        <Route path="/account" element={<Account />} />
        <Route path="/donate" element={<Donate />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRoles={['Admin', 'Worker']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="resident-directory" element={<AdminResidentDirectory />} />
          <Route path="donors" element={<AdminDonors />} />
          <Route path="process-recordings" element={<AdminProcessRecordings />} />
          <Route path="safehouse-management" element={<AdminSafehouseManagement />} />
          <Route path="user-management" element={<AdminUserManagement />} />
          <Route path="home-visits" element={<AdminHomeVisits />} />
          <Route path="*" element={<AdminCatchAll />} />
        </Route>
      </Routes>
      <CookieConsent />
    </>
  );
}
