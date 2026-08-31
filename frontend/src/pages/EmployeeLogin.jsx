import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ScanLine, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { api } from '../services/api.js';
import { useLang } from '../i18n/index.jsx';

export default function EmployeeLogin() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();
  const { t } = useLang();

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.loginEmployee({ email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_role', 'employee');
      navigate('/employee/scan');
    } catch (err) {
      setError(err.connection ? t('errorConnect') : err.message);
    } finally {
      setLoading(false);
    }
  }

  const INP = 'w-full bg-neutral-100 border border-neutral-300 rounded-full py-[13px] sm:py-[15px] px-5 text-[15px] text-ink placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition';

  return (
    <div className="min-h-dvh bg-bg font-sans flex flex-col relative overflow-hidden">

      {/* círculo decorativo */}
      <div className="absolute -bottom-[90px] -left-[60px] w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] rounded-full bg-sage-200 pointer-events-none" />

      <form onSubmit={onSubmit}
        className="relative flex-1 flex flex-col px-6 pt-safe"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 36px)' }}>

        <div className="flex-1 flex flex-col gap-5 sm:gap-[26px] max-w-[420px] mx-auto w-full pb-6"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>

          {/* fila superior: logo Fidely + flecha atrás */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand grid place-items-center">
                <ScanLine size={15} strokeWidth={2.75} className="text-white" />
              </div>
              <span className="font-display text-[19px] text-ink">Fidely</span>
            </Link>
            <Link to="/"
              className="w-10 h-10 rounded-full bg-neutral-200 grid place-items-center text-neutral-700 hover:bg-neutral-300 transition">
              <ArrowLeft size={18} strokeWidth={2.75} />
            </Link>
          </div>

          {/* ícono */}
          <div className="w-[52px] h-[52px] sm:w-[62px] sm:h-[62px] rounded-[18px] sm:rounded-[22px] bg-sage-600 grid place-items-center text-white shadow-md">
            <ScanLine size={24} strokeWidth={2.75} className="sm:hidden" />
            <ScanLine size={28} strokeWidth={2.75} className="hidden sm:block" />
          </div>

          {/* encabezado */}
          <div className="flex flex-col gap-2">
            <h1 className="font-display font-normal text-[28px] sm:text-[36px] leading-[1.05] text-ink m-0">
              Acceso empleado
            </h1>
            <p className="text-[14px] sm:text-[15px] text-neutral-700 leading-[1.5] m-0">
              Inicia sesión para registrar sellos y canjear recompensas de tu negocio.
            </p>
          </div>

          {/* campos */}
          <div className="flex flex-col gap-3 sm:gap-[14px]">
            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-[6px]">
              <label className="text-[12.5px] sm:text-[13px] font-extrabold text-neutral-800">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="ana@cafeaurora.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className={INP}
              />
            </div>

            <div className="flex flex-col gap-[6px]">
              <label className="text-[12.5px] sm:text-[13px] font-extrabold text-neutral-800">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className={`${INP} border-2 border-brand focus:border-brand pr-[48px]`}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-[18px] top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700">
                  {showPw
                    ? <EyeOff size={17} strokeWidth={2.75} />
                    : <Eye    size={17} strokeWidth={2.75} />}
                </button>
              </div>
            </div>
          </div>

          {/* spacer que empuja el botón hacia abajo pero sin estirarse demasiado */}
          <div className="flex-1 max-h-16" />

          {/* botón + nota */}
          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-600 text-white font-extrabold text-[16px] sm:text-[17px] py-[15px] sm:py-[18px] rounded-full shadow-md transition disabled:opacity-45 flex items-center justify-center">
              {loading
                ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Ingresar'}
            </button>
            <p className="text-center text-[12.5px] sm:text-[13px] text-neutral-600 m-0">
              Tu administrador crea las cuentas de empleado.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
