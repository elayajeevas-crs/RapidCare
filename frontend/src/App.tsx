import { Link, Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import Emergency from './pages/Emergency';
import Login from './pages/Login';
import Shared from './pages/Shared';
import FirstAid from './pages/FirstAid';
import FacilityDashboard from './pages/FacilityDashboard';
import AdminDashboard from './pages/AdminDashboard';
import RequireRole from './components/RequireRole';
import { getUser, homeFor, logout } from './utils/auth';

export default function App() {
  const u = getUser();
  return (
    <>
      <nav className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3"><Link to="/" className="text-lg font-extrabold text-rescue">RapidCare</Link>
        <div className="flex gap-4 text-sm font-semibold"><Link to="/emergency">Emergency</Link><Link to="/first-aid">First aid</Link>
          {u ? <><Link to={homeFor(u.role)}>{u.role === 'PATIENT' ? u.name : 'Dashboard'}</Link><button onClick={logout}>Logout</button></> : <Link to="/login">Log in</Link>}</div></nav>
      <Routes><Route path="/" element={<Landing />} /><Route path="/emergency" element={<Emergency />} /><Route path="/first-aid" element={<FirstAid />} />
        <Route path="/login" element={<Login />} /><Route path="/register" element={<Login register />} /><Route path="/emergency/share/:token" element={<Shared />} />
        <Route path="/facility" element={<RequireRole role="FACILITY"><FacilityDashboard /></RequireRole>} />
        <Route path="/admin" element={<RequireRole role="ADMIN"><AdminDashboard /></RequireRole>} />
        <Route path="*" element={<main className="p-8 text-center">Page not found. <Link className="underline" to="/">Go home</Link></main>} /></Routes>
    </>
  );
}
