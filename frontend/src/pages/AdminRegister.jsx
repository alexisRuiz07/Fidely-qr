import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, QrCode, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api.js';
import { useLang } from '../i18n/index.jsx';

export default function AdminRegister() {
  const [businessName, setBusinessName] = useState('');
  const [fullName,     setFullName]     = useState('');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPw,       setShowPw]       = useState(false);
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const navigate = useNavigate();
  const { t } = useLang();

  const pwStrength = password.length === 0 ? 0
    : password.length < 6  ? 25
    : password.length < 10 ? 60
    : 100;

  const pwLabel = pwStrength === 0 ? '' : pwStrength <= 25 ? 'Débil' : pwStrength <= 60 ? 'Media' : 'Segura';
  const pwColor = pwStrength <= 25 ? 'bg-red-400' : pwStrength <= 60 ? 'bg-amber-400' : 'bg-sage-500';
  const pwTextColor = pwStrength <= 25 ? 'text-red-600' : pwStrength <= 60 ? 'text-amber-600' : 'text-sage-700';

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.registerAdmin({ email, password, full_name: fullName });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_role', 'admin');
      if (businessName) localStorage.setItem('pending_business_name', businessName);
      navigate('/admin');
    } catch (err) {
      setError(err.connection ? t('errorConnect') : err.message);
    } finally {
      setLoading(false);
    }
  }

  const INP = 'w-full bg-neutral-100 border border-neutral-300 rounded-full py-[14px] px-[22px] text-[15px] text-ink placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition';

  const STEPS = [
    { n: 1, title: 'Crea tu cuenta',    desc: 'Datos del negocio y del administrador.' },
    { n: 2, title: 'Diseña tu tarjeta', desc: 'Sellos, recompensa, color y logo.' },
    { n: 3, title: 'Imprime el QR',     desc: 'Ponlo en el mostrador y empieza a sellar.' },
  ];

  return (
    <div className="min-h-dvh bg-bg font-sans flex items-stretch">

      {/* ── Panel izquierdo (sage) ── */}
      <div className="hidden lg:flex w-[520px] flex-none bg-sage-700 text-white flex-col justify-between p-14 relative overflow-hidden">
        {/* círculos decorativos */}
        <div className="absolute -top-[140px] -left-[120px] w-[400px] h-[400px] rounded-full bg-sage-600" />
        <div className="absolute -bottom-[130px] -right-[110px] w-[320px] h-[320px] rounded-full bg-sage-800" />

        {/* logo */}
        <Link to="/" className="relative flex items-center gap-3 w-fit">
          <div className="w-11 h-11 rounded-2xl bg-bg grid place-items-center text-sage-700">
            <QrCode size={23} strokeWidth={2.75} />
          </div>
          <span className="font-display text-2xl text-white">Fidely</span>
        </Link>

        {/* heading + steps */}
        <div className="relative flex flex-col gap-[22px]">
          <h2 className="font-display font-normal text-[44px] leading-[1.04]">
            Listo en tres pasos
          </h2>
          <div className="flex flex-col gap-4 max-w-[340px]">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="flex items-start gap-[14px]">
                <div className={`w-[34px] h-[34px] flex-none rounded-full grid place-items-center font-extrabold text-[15px]
                  ${n === 1 ? 'bg-sage-300 text-sage-900' : 'bg-white/[.18] text-white'}`}>
                  {n}
                </div>
                <div>
                  <div className="font-extrabold text-[15.5px]">{title}</div>
                  <div className="text-[14px] text-white/80 leading-[1.45]">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-[13.5px] text-white/70">
          Gratis hasta 200 tarjetas activas.
        </div>
      </div>

      {/* ── Panel derecho (formulario) ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
        <div className="w-full max-w-[420px] flex flex-col gap-5 sm:gap-[22px]">

          {/* encabezado */}
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[11px] uppercase tracking-[.14em] text-neutral-600">
              Paso 1 de 3
            </p>
            <h1 className="font-display font-normal text-[26px] sm:text-[36px] leading-[1.05] text-ink">
              Crear cuenta
            </h1>
          </div>

          {/* barra de progreso */}
          <div className="flex gap-[6px]">
            <div className="flex-1 h-[6px] rounded-full bg-brand-500" />
            <div className="flex-1 h-[6px] rounded-full bg-neutral-300" />
            <div className="flex-1 h-[6px] rounded-full bg-neutral-300" />
          </div>

          {/* error */}
          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* formulario */}
          <form onSubmit={onSubmit} className="flex flex-col gap-[14px]">

            <div className="flex flex-col gap-[7px]">
              <label className="text-[13px] font-extrabold text-neutral-800">
                Nombre del negocio
              </label>
              <input type="text" placeholder="Café Aurora" value={businessName}
                onChange={e => setBusinessName(e.target.value)} required
                className={`${INP} border-2 border-brand-500 focus:border-brand-500`} />
            </div>

            <div className="flex flex-col gap-[7px]">
              <label className="text-[13px] font-extrabold text-neutral-800">
                Tu nombre completo
              </label>
              <input type="text" placeholder="Tu nombre" value={fullName}
                onChange={e => setFullName(e.target.value)} required
                className={INP} />
            </div>

            <div className="flex flex-col gap-[7px]">
              <label className="text-[13px] font-extrabold text-neutral-800">
                Correo electrónico
              </label>
              <input type="email" placeholder="tu@negocio.com" value={email}
                onChange={e => setEmail(e.target.value)} required
                className={INP} />
            </div>

            <div className="flex flex-col gap-[7px]">
              <label className="text-[13px] font-extrabold text-neutral-800">
                Contraseña
              </label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} placeholder="Mínimo 6 caracteres"
                  value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                  className={`${INP} pr-[46px]`} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-[18px] top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700">
                  {showPw
                    ? <EyeOff size={16} strokeWidth={2.75} />
                    : <Eye    size={16} strokeWidth={2.75} />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="flex items-center gap-[9px] pl-[6px]">
                  <div className="flex-1 h-[5px] rounded-full bg-neutral-300 overflow-hidden max-w-[150px]">
                    <div className={`h-full rounded-full transition-all ${pwColor}`}
                      style={{ width: `${pwStrength}%` }} />
                  </div>
                  <span className={`text-[12.5px] font-bold ${pwTextColor}`}>{pwLabel}</span>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-[16px] py-4 rounded-full flex items-center justify-center gap-[10px] shadow-md transition disabled:opacity-45 mt-1">
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Continuar
                  <ArrowRight size={18} strokeWidth={2.75} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[14px] text-neutral-700">
            ¿Ya tienes cuenta?{' '}
            <Link to="/admin/login" className="text-brand-700 font-medium hover:underline underline-offset-2">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
