// src/App.tsx
import { Routes, Route } from 'react-router-dom';

import Navbar          from './components/layout/Navbar';
import Home            from './pages/Home';
import Donate          from './pages/Donate';
import Admin           from './pages/Admin';
import Login           from './pages/Login';
import ImpactDashboard from './pages/ImpactDashboard';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"       element={<Home />}            />
        <Route path="/donate" element={<Donate />}          />
        <Route path="/admin"  element={<Admin />}           />
        <Route path="/login"  element={<Login />}           />
        <Route path="/impact" element={<ImpactDashboard />} />
      </Routes>
    </>
  );
}
