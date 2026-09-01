import { useState, useEffect } from 'react';
import { Smartphone, Languages, Bell, Moon, CreditCard, Check, X, ScanLine, Mail, RotateCcw, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav.jsx';
import { useLang } from '../i18n/index.jsx';
import { api } from '../services/api.js';
import { getDeviceId } from '../utils/device.js';

/* ── helpers de tema ─────────────────────────────────────────────── */
function applyTheme(dark) {
  if (dark) {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('fidely_theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('fidely_theme', 'light');
  }
}

async function requestNotifications() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  const result = await Notification.requestPermission();
  return result;
}

function fireTestNotification() {
  if (Notification.permission !== 'granted') return;
  new Notification('Fidely QR · Recompensa lista 🎉', {
    body: 'Las notificaciones están activas. Te avisaremos cuando tengas una recompensa lista.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  });
}

function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle}
      className="relative w-[48px] h-[28px] rounded-full transition-colors duration-200 shrink-0"
      style={{ background: on ? '#4a7c59' : 'var(--color-neutral-300, #dcd3c4)' }}>
      <span className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: on ? 'calc(100% - 25px)' : '3px' }} />
    </button>
  );
}

function Divider() {
  return <div className="h-px" style={{ background: 'rgba(32,30,29,.10)' }} />;
}

export default function Perfil() {
  const { lang, setLang } = useLang();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('fidely_theme') === 'dark');
  const [avisos,   setAvisos]   = useState(() => localStorage.getItem('fidely_notif') === 'on');
  const [notifStatus, setNotifStatus] = useState(() => {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied')  return 'denied';
    return 'idle';
  });

  // email linking
  const [linkedEmail,    setLinkedEmail]    = useState(() => localStorage.getItem('fidely_email') || '');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput,     setEmailInput]     = useState('');
  const [linking,        setLinking]        = useState(false);
  const [emailError,     setEmailError]     = useState('');

  // wallet recovery
  const [showRecover,   setShowRecover]   = useState(false);
  const [recoverEmail,  setRecoverEmail]  = useState('');
  const [recovering,    setRecovering]    = useState(false);
  const [recoverError,  setRecoverError]  = useState('');
  const [recoverOk,     setRecoverOk]     = useState(false);

  useEffect(() => {
    if (notifStatus === 'granted') {
      setAvisos(true);
      localStorage.setItem('fidely_notif', 'on');
    }
  }, [notifStatus]);

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    applyTheme(next);
  }

  async function toggleAvisos() {
    if (avisos) {
      setAvisos(false);
      localStorage.setItem('fidely_notif', 'off');
      return;
    }
    const result = await requestNotifications();
    setNotifStatus(result);
    if (result === 'granted') {
      setAvisos(true);
      localStorage.setItem('fidely_notif', 'on');
      fireTestNotification();
    }
  }

  async function handleLinkEmail(e) {
    e.preventDefault();
    setLinking(true);
    setEmailError('');
    try {
      await api.linkEmail(getDeviceId(), emailInput.trim());
      localStorage.setItem('fidely_email', emailInput.trim());
      setLinkedEmail(emailInput.trim());
      setShowEmailModal(false);
      setEmailInput('');
    } catch (err) {
      setEmailError(err.message);
    } finally {
      setLinking(false);
    }
  }

  async function handleRecover(e) {
    e.preventDefault();
    setRecovering(true);
    setRecoverError('');
    try {
      await api.recoverWallet(recoverEmail.trim(), getDeviceId());
      localStorage.setItem('fidely_email', recoverEmail.trim());
      setLinkedEmail(recoverEmail.trim());
      setRecoverOk(true);
    } catch (err) {
      setRecoverError(err.message);
    } finally {
      setRecovering(false);
    }
  }

  return (
    <div className="min-h-dvh bg-bg font-sans flex flex-col">

      {/* ── cabecera ── */}
      <div className="px-[22px] pb-5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}>
        <div className="max-w-md mx-auto flex flex-col gap-3">
          <Link to="/" className="flex items-center gap-2 w-fit">
            <div className="w-8 h-8 rounded-xl bg-brand grid place-items-center">
              <ScanLine size={15} strokeWidth={2.75} className="text-white" />
            </div>
            <span className="font-display text-[19px] text-ink">Fidely</span>
          </Link>
          <h1 className="font-display font-normal text-[34px] leading-[1.05] text-ink m-0">Perfil</h1>
        </div>
      </div>

      {/* ── contenido ── */}
      <div className="flex-1 px-[22px]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}>
        <div className="max-w-md mx-auto flex flex-col gap-[18px]">

          {/* ── panel correo ── */}
          {linkedEmail ? (
            <div className="rounded-2xl p-[18px] flex flex-col gap-3 bg-sage-100">
              <div className="flex items-center gap-3">
                <div className="w-[46px] h-[46px] rounded-full grid place-items-center shrink-0 bg-sage-600">
                  <Mail size={20} strokeWidth={2.75} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-[15px] text-ink">Correo vinculado</div>
                  <div className="text-[13px] mt-[2px] text-sage-800 truncate">{linkedEmail}</div>
                </div>
              </div>
              <button
                onClick={() => { setEmailInput(linkedEmail); setShowEmailModal(true); }}
                className="w-full py-[11px] rounded-full font-bold text-[14px] bg-sage-200 text-sage-900 hover:bg-sage-300 transition">
                Cambiar correo
              </button>
            </div>
          ) : (
            <div className="rounded-2xl p-[18px] flex flex-col gap-3 bg-brand-200">
              <div className="flex items-center gap-3">
                <div className="w-[46px] h-[46px] rounded-full grid place-items-center shrink-0 bg-brand">
                  <Smartphone size={21} strokeWidth={2.75} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-[15px] text-ink">Invitado en este dispositivo</div>
                  <div className="text-[13px] mt-[2px] text-brand-700">Tus tarjetas viven solo aquí</div>
                </div>
              </div>
              <button
                onClick={() => setShowEmailModal(true)}
                className="w-full py-[13px] rounded-full font-extrabold text-[15px] text-white bg-brand hover:bg-brand-600 transition">
                Vincular un correo para no perderlas
              </button>
              <button
                onClick={() => setShowRecover(true)}
                className="w-full py-[11px] rounded-full font-bold text-[14px] text-brand-800 bg-brand-100 hover:bg-brand-200 transition flex items-center justify-center gap-2">
                <RotateCcw size={14} strokeWidth={2.75} />
                Recuperar wallet de otro dispositivo
              </button>
            </div>
          )}

          {/* ── preferencias ── */}
          <div className="flex flex-col gap-2">
            <div className="font-mono text-[11px] uppercase tracking-[.14em] text-neutral-600 px-[2px]">Preferencias</div>
            <div className="rounded-2xl overflow-hidden bg-neutral-100">

              <div className="flex items-center gap-3 px-4 py-[15px]">
                <Languages size={19} strokeWidth={2.75} className="text-neutral-700 shrink-0" />
                <span className="flex-1 font-semibold text-[15px] text-ink">Idioma</span>
                <div className="flex gap-1 p-[3px] rounded-full bg-neutral-200">
                  {['ES', 'EN'].map(l => (
                    <button key={l} onClick={() => setLang(l.toLowerCase())}
                      className="text-[12px] font-extrabold px-3 py-[5px] rounded-full transition"
                      style={lang === l.toLowerCase()
                        ? { background: 'var(--color-bg)', color: 'rgb(var(--color-ink-ch))' }
                        : { color: 'var(--color-neutral-600)' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <Divider />

              <div className="flex flex-col gap-0">
                <div className="flex items-center gap-3 px-4 py-[15px]">
                  <Bell size={19} strokeWidth={2.75} className="text-neutral-700 shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold text-[15px] text-ink">Avisos de recompensa</span>
                    {notifStatus === 'denied' && (
                      <div className="flex items-center gap-1 mt-[3px]">
                        <X size={12} strokeWidth={2.75} className="text-red-600" />
                        <span className="text-[12px] text-red-600">Bloqueado por el navegador — actívalo en Ajustes</span>
                      </div>
                    )}
                    {notifStatus === 'granted' && avisos && (
                      <div className="flex items-center gap-1 mt-[3px]">
                        <Check size={12} strokeWidth={2.75} className="text-sage-700" />
                        <span className="text-[12px] text-sage-700">Activas</span>
                      </div>
                    )}
                    {notifStatus === 'unsupported' && (
                      <p className="text-[12px] text-neutral-600 mt-[2px]">Tu navegador no soporta notificaciones</p>
                    )}
                  </div>
                  <Toggle on={avisos && notifStatus !== 'denied' && notifStatus !== 'unsupported'} onToggle={toggleAvisos} />
                </div>
              </div>

              <Divider />

              <div className="flex items-center gap-3 px-4 py-[15px]">
                <Moon size={19} strokeWidth={2.75} className="text-neutral-700 shrink-0" />
                <div className="flex-1">
                  <span className="font-semibold text-[15px] text-ink">Tema oscuro</span>
                  {darkMode && (
                    <div className="flex items-center gap-1 mt-[3px]">
                      <Check size={12} strokeWidth={2.75} className="text-sage-700" />
                      <span className="text-[12px] text-sage-700">Activo</span>
                    </div>
                  )}
                </div>
                <Toggle on={darkMode} onToggle={toggleDark} />
              </div>
            </div>
          </div>

          {/* ── wallet del sistema ── */}
          <div className="flex flex-col gap-2">
            <div className="font-mono text-[11px] uppercase tracking-[.14em] text-neutral-600 px-[2px]">Wallet del sistema</div>
            <div className="bg-neutral-100 rounded-2xl px-4 py-4 flex items-center gap-3">
              <CreditCard size={19} strokeWidth={2.75} className="text-neutral-700 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[15px] text-ink">Apple / Google Wallet</div>
                <div className="text-[12.5px] text-neutral-600 mt-[1px]">Exportar pases nativos</div>
              </div>
              <span className="text-[11.5px] font-extrabold px-[11px] py-[6px] rounded-full shrink-0 bg-sage-200 text-sage-800">Pronto</span>
            </div>
          </div>

          <div className="text-center text-[12.5px] text-neutral-600 mt-auto pt-2">
            Fidely QR · v0.4 · <button className="underline underline-offset-2">Términos</button>
          </div>
        </div>
      </div>

      <BottomNav active="perfil" />

      {/* ── MODAL vincular correo ── */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-bg rounded-2xl shadow-xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[22px] text-ink">Vincular correo</h3>
              <button onClick={() => { setShowEmailModal(false); setEmailError(''); }}
                className="w-9 h-9 rounded-full bg-neutral-200 grid place-items-center hover:bg-neutral-300 transition">
                <X size={16} strokeWidth={2.75} className="text-neutral-700" />
              </button>
            </div>
            <p className="text-[13.5px] text-neutral-600 leading-snug -mt-2">
              Si cambias de teléfono, podrás recuperar todas tus tarjetas iniciando sesión con este correo.
            </p>
            <form onSubmit={handleLinkEmail} className="flex flex-col gap-3">
              <input
                type="email"
                required
                autoFocus
                placeholder="tu@correo.com"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                className="w-full bg-neutral-100 border border-neutral-300 rounded-full py-[13px] px-[18px] text-[15px] text-ink outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition"
              />
              {emailError && <p className="text-[13px] text-red-600 px-1">{emailError}</p>}
              <button type="submit" disabled={linking || !emailInput}
                className="w-full bg-brand text-white font-extrabold text-[15px] py-[14px] rounded-full hover:bg-brand-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {linking ? <Loader size={18} strokeWidth={2.75} className="animate-spin" /> : <Mail size={18} strokeWidth={2.75} />}
                {linking ? 'Vinculando…' : 'Vincular correo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL recuperar wallet ── */}
      {showRecover && (
        <div className="fixed inset-0 z-50 bg-ink/50 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-bg rounded-2xl shadow-xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[22px] text-ink">Recuperar wallet</h3>
              <button onClick={() => { setShowRecover(false); setRecoverError(''); setRecoverOk(false); }}
                className="w-9 h-9 rounded-full bg-neutral-200 grid place-items-center hover:bg-neutral-300 transition">
                <X size={16} strokeWidth={2.75} className="text-neutral-700" />
              </button>
            </div>

            {recoverOk ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="w-14 h-14 rounded-full bg-sage-200 grid place-items-center">
                  <Check size={28} strokeWidth={2.75} className="text-sage-700" />
                </div>
                <p className="font-bold text-[16px] text-ink">¡Wallet recuperada!</p>
                <p className="text-[13.5px] text-neutral-600">Ve a Mi Wallet para ver tus tarjetas.</p>
                <Link to="/wallet"
                  className="w-full bg-brand text-white font-bold text-[15px] py-[13px] rounded-full text-center hover:bg-brand-600 transition"
                  onClick={() => setShowRecover(false)}>
                  Ver mi wallet
                </Link>
              </div>
            ) : (
              <>
                <p className="text-[13.5px] text-neutral-600 leading-snug -mt-2">
                  Ingresa el correo que vinculaste desde tu dispositivo anterior. Transferiremos todas tus tarjetas a este teléfono.
                </p>
                <form onSubmit={handleRecover} className="flex flex-col gap-3">
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="tu@correo.com"
                    value={recoverEmail}
                    onChange={e => setRecoverEmail(e.target.value)}
                    className="w-full bg-neutral-100 border border-neutral-300 rounded-full py-[13px] px-[18px] text-[15px] text-ink outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition"
                  />
                  {recoverError && <p className="text-[13px] text-red-600 px-1">{recoverError}</p>}
                  <button type="submit" disabled={recovering || !recoverEmail}
                    className="w-full bg-brand text-white font-extrabold text-[15px] py-[14px] rounded-full hover:bg-brand-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {recovering ? <Loader size={18} strokeWidth={2.75} className="animate-spin" /> : <RotateCcw size={18} strokeWidth={2.75} />}
                    {recovering ? 'Recuperando…' : 'Recuperar wallet'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
