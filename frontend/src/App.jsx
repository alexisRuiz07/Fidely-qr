import { Routes, Route, Navigate } from 'react-router-dom';
import RequireAuth from './components/RequireAuth.jsx';

// Cliente
import PrinterWelcome from './pages/PrinterWelcome.jsx';
import Wallet from './pages/Wallet.jsx';
import WatchQr from './pages/WatchQr.jsx';
import Home from './pages/Home.jsx';

// Empleado
import EmployeeLogin from './pages/EmployeeLogin.jsx';
import ScanQr from './pages/ScanQr.jsx';

// Admin
import AdminLogin from './pages/AdminLogin.jsx';
import AdminRegister from './pages/AdminRegister.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

export default function App() {
  return (
    <Routes>
      {/* Landing / selector */}
      <Route path="/" element={<Home />} />

      {/* Cliente (sin cuenta) */}
      <Route path="/welcome/:cardId" element={<PrinterWelcome />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/card/:cardId" element={<WatchQr />} />

      {/* Empleado */}
      <Route path="/employee/login" element={<EmployeeLogin />} />
      <Route
        path="/employee/scan"
        element={
          <RequireAuth role="employee" redirectTo="/employee/login">
            <ScanQr />
          </RequireAuth>
        }
      />

      {/* Admin */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/register" element={<AdminRegister />} />
      <Route
        path="/admin"
        element={
          <RequireAuth role="admin" redirectTo="/admin/login">
            <AdminDashboard />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
