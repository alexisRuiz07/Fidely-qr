import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RequireAuth from './components/RequireAuth.jsx';

// Cliente
import PrinterWelcome from './pages/PrinterWelcome.jsx';
import Wallet from './pages/Wallet.jsx';
import WatchQr from './pages/WatchQr.jsx';
import MiQr from './pages/MiQr.jsx';
import Perfil from './pages/Perfil.jsx';
import Home from './pages/Home.jsx';

// Empleado
import EmployeeLogin from './pages/EmployeeLogin.jsx';

// Admin
import AdminLogin from './pages/AdminLogin.jsx';
import AdminRegister from './pages/AdminRegister.jsx';

// Carga diferida: reducen el bundle inicial notablemente
const ScanQr         = lazy(() => import('./pages/ScanQr.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const AddCard        = lazy(() => import('./pages/AddCard.jsx'));

function PageLoading() {
  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        {/* Landing / selector */}
        <Route path="/" element={<Home />} />

        {/* Cliente (sin cuenta) */}
        <Route path="/welcome/:cardId" element={<PrinterWelcome />} />
        <Route path="/wallet"          element={<Wallet />} />
        <Route path="/card/:cardId"    element={<WatchQr />} />
        <Route path="/mi-qr"           element={<MiQr />} />
        <Route path="/perfil"          element={<Perfil />} />
        <Route path="/add-card"        element={<AddCard />} />

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
        <Route path="/admin/login"     element={<AdminLogin />} />
        <Route path="/admin/register"  element={<AdminRegister />} />
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
    </Suspense>
  );
}
