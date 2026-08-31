import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff, QrCode } from 'lucide-react';
import { api } from '../services/api.js';
import { useLang } from '../i18n/index.jsx';

export default function AdminLogin() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [keep, setKeep]         = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();
  const { t } = useLang();

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.loginAdmin({ email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_role', 'admin');
      navigate('/admin');
    } catch (err) {
      setError(err.connection ? t('errorConnect') : err.message);
    } finally {
      setLoading(false);
    }
  }

  const INP = 'w-full bg-neutral-100 border border-neutral-300 rounded-full py-[14px] pl-[46px] pr-[46px] text-[15px] text-ink placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition';

  return (
    <div className="min-h-dvh bg-bg font-sans flex items-stretch">

      {/* ── Panel izquierdo (brand) ── */}
      <div className="hidden lg:flex w-[520px] flex-none bg-brand-700 text-white flex-col justify-between p-14 relative overflow-hidden">
        {/* círculos decorativos */}
        <div className="absolute -top-[140px] -left-[120px] w-[400px] h-[400px] rounded-full bg-brand-600" />
        <div className="absolute -bottom-[130px] -right-[110px] w-[320px] h-[320px] rounded-full bg-brand-800" />

        {/* logo */}
        <Link to="/" className="relative flex items-center gap-3 w-fit">
          <div className="w-11 h-11 rounded-2xl bg-bg grid place-items-center text-brand-700">
            <QrCode size={23} strokeWidth={2.75} />
          </div>
          <span className="font-display text-2xl text-white">Fidely</span>
        </Link>

        {/* tagline + estadísticas */}
        <div className="relative flex flex-col gap-7">
          <h2 className="font-display font-normal text-[44px] leading-[1.04] max-w-[360px]">
            Tus clientes vuelven cuando los reconoces
          </h2>
          <div className="flex gap-10">
            <div>
              <div className="font-display text-[36px] leading-tight">1.284</div>
              <div className="text-[13.5px] text-white/75">sellos este mes</div>
            </div>
            <div>
              <div className="font-display text-[36px] leading-tight">61%</div>
              <div className="text-[13.5px] text-white/75">clientes que vuelven</div>
            </div>
          </div>
        </div>

        <div className="relative text-[13px] text-white/60">
          Fidely QR · Panel de administrador
        </div>
      </div>

      {/* ── Panel derecho (formulario) ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
        <div className="w-full max-w-[420px] flex flex-col gap-5 sm:gap-[22px]">

          {/* encabezado */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] uppercase tracking-[.14em] text-neutral-600">
              Acceso administrador
            </p>
            <h1 className="font-display font-normal text-[28px] sm:text-[38px] leading-[1.05] text-ink">
              Bienvenido de vuelta
            </h1>
          </div>

          {/* error */}
          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* formulario */}
          <form onSubmit={onSubmit} className="flex flex-col gap-[14px]">

            {/* email */}
            <div className="relative">
              <Mail size={16} strokeWidth={2.75}
                className="absolute left-[18px] top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              <input type="email" placeholder={t('email')} value={email}
                onChange={e => setEmail(e.target.value)} required
                className={INP} />
            </div>

            {/* contraseña */}
            <div className="relative">
              <Lock size={16} strokeWidth={2.75}
                className="absolute left-[18px] top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              <input type={showPw ? 'text' : 'password'} placeholder={t('password')}
                value={password} onChange={e => setPassword(e.target.value)} required
                className={INP} />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-[18px] top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700">
                {showPw
                  ? <EyeOff size={16} strokeWidth={2.75} />
                  : <Eye    size={16} strokeWidth={2.75} />}
              </button>
            </div>

            {/* opciones */}
            <div className="flex items-center justify-between text-sm px-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-700">
                <input type="checkbox" checked={keep} onChange={e => setKeep(e.target.checked)}
                  className="w-4 h-4 accent-brand-600 rounded" />
                Mantener sesión
              </label>
              <span className="text-brand-700 font-medium hover:underline underline-offset-2 cursor-pointer text-[13px]">
                ¿Olvidaste tu contraseña?
              </span>
            </div>

            {/* submit */}
            <button type="submit" disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-[16px] py-4 rounded-full flex items-center justify-center gap-[10px] shadow-md transition disabled:opacity-45 mt-1">
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} strokeWidth={2.75} />
                  Ingresar
                </>
              )}
            </button>
          </form>

          {/* link a registro */}
          <p className="text-center text-[14px] text-neutral-700">
            ¿No tienes cuenta?{' '}
            <Link to="/admin/register" className="text-brand-700 font-medium hover:underline underline-offset-2">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
