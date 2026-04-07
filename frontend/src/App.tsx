// src/App.tsx
import { Routes, Route } from 'react-router-dom';

import Navbar  from './components/layout/Navbar';
import Home    from './pages/Home';
import Donate  from './pages/Donate';
import Admin   from './pages/Admin';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"       element={<Home />}   />
        <Route path="/donate" element={<Donate />} />
        <Route path="/admin"  element={<Admin />}  />
      </Routes>
    </>
  );
}
