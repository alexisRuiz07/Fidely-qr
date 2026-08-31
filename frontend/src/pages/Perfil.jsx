import { useState, useEffect } from 'react';
import { Smartphone, Languages, Bell, Moon, CreditCard, Check, X, ScanLine } from 'lucide-react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav.jsx';
import { useLang } from '../i18n/index.jsx';

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

/* ── helpers de notificaciones ──────────────────────────────────── */
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

/* ── componentes ─────────────────────────────────────────────────── */
function Toggle({ on, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="relative w-[48px] h-[28px] rounded-full transition-colors duration-200 shrink-0"
      style={{ background: on ? '#4a7c59' : 'var(--color-neutral-300, #dcd3c4)' }}>
      <span
        className="absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: on ? 'calc(100% - 25px)' : '3px' }}
      />
    </button>
  );
}

function Divider() {
  return <div className="h-px" style={{ background: 'rgba(32,30,29,.10)' }} />;
}

/* ── página ─────────────────────────────────────────────────────── */
export default function Perfil() {
  const { lang, setLang, t } = useLang();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('fidely_theme') === 'dark');
  const [avisos,   setAvisos]   = useState(() => localStorage.getItem('fidely_notif') === 'on');
  /* 'idle' | 'granted' | 'denied' | 'unsupported' */
  const [notifStatus, setNotifStatus] = useState(() => {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied')  return 'denied';
    return 'idle';
  });

  /* sincroniza toggle de notificaciones con el permiso real del navegador */
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
      /* apagar — no revocamos el permiso del navegador, solo guardamos preferencia */
      setAvisos(false);
      localStorage.setItem('fidely_notif', 'off');
      return;
    }
    /* encender — pedir permiso si no está concedido */
    const result = await requestNotifications();
    setNotifStatus(result);
    if (result === 'granted') {
      setAvisos(true);
      localStorage.setItem('fidely_notif', 'on');
      fireTestNotification();
    }
  }

  return (
    <div className="min-h-dvh bg-bg font-sans flex flex-col">

      {/* ── cabecera ── */}
      <div className="px-[22px] pb-5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}>
        <div className="max-w-md mx-auto flex flex-col gap-3">

          {/* logo Fidely → inicio */}
          <Link to="/" className="flex items-center gap-2 w-fit">
            <div className="w-8 h-8 rounded-xl bg-brand grid place-items-center">
              <ScanLine size={15} strokeWidth={2.75} className="text-white" />
            </div>
            <span className="font-display text-[19px] text-ink">Fidely</span>
          </Link>

          <h1 className="font-display font-normal text-[34px] leading-[1.05] text-ink m-0">
            Perfil
          </h1>
        </div>
      </div>

      {/* ── contenido ── */}
      <div className="flex-1 px-[22px]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}>
        <div className="max-w-md mx-auto flex flex-col gap-[18px]">

          {/* ── panel invitado ── */}
          <div className="rounded-2xl p-[18px] flex flex-col gap-3 bg-brand-200">
            <div className="flex items-center gap-3">
              <div className="w-[46px] h-[46px] rounded-full grid place-items-center shrink-0 bg-brand">
                <Smartphone size={21} strokeWidth={2.75} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-[15px] text-ink">
                  Invitado en este dispositivo
                </div>
                <div className="text-[13px] mt-[2px] text-brand-700">
                  Tus tarjetas viven solo aquí
                </div>
              </div>
            </div>
            <button className="w-full py-[13px] rounded-full font-extrabold text-[15px] text-white bg-brand">
              Vincular un correo para no perderlas
            </button>
          </div>

          {/* ── preferencias ── */}
          <div className="flex flex-col gap-2">
            <div className="font-mono text-[11px] uppercase tracking-[.14em] text-neutral-600 px-[2px]">
              Preferencias
            </div>
            <div className="rounded-2xl overflow-hidden bg-neutral-100">

              {/* idioma */}
              <div className="flex items-center gap-3 px-4 py-[15px]">
                <Languages size={19} strokeWidth={2.75} className="text-neutral-700 shrink-0" />
                <span className="flex-1 font-semibold text-[15px] text-ink">Idioma</span>
                <div className="flex gap-1 p-[3px] rounded-full bg-neutral-200">
                  {['ES', 'EN'].map(l => (
                    <button key={l}
                      onClick={() => setLang(l.toLowerCase())}
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

              {/* avisos de recompensa */}
              <div className="flex flex-col gap-0">
                <div className="flex items-center gap-3 px-4 py-[15px]">
                  <Bell size={19} strokeWidth={2.75} className="text-neutral-700 shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold text-[15px] text-ink">Avisos de recompensa</span>
                    {notifStatus === 'denied' && (
                      <div className="flex items-center gap-1 mt-[3px]">
                        <X size={12} strokeWidth={2.75} className="text-red-600" />
                        <span className="text-[12px] text-red-600">
                          Bloqueado por el navegador — actívalo en Ajustes
                        </span>
                      </div>
                    )}
                    {notifStatus === 'granted' && avisos && (
                      <div className="flex items-center gap-1 mt-[3px]">
                        <Check size={12} strokeWidth={2.75} className="text-sage-700" />
                        <span className="text-[12px] text-sage-700">Activas</span>
                      </div>
                    )}
                    {notifStatus === 'unsupported' && (
                      <p className="text-[12px] text-neutral-600 mt-[2px]">
                        Tu navegador no soporta notificaciones
                      </p>
                    )}
                  </div>
                  <Toggle
                    on={avisos && notifStatus !== 'denied' && notifStatus !== 'unsupported'}
                    onToggle={toggleAvisos}
                  />
                </div>
              </div>

              <Divider />

              {/* tema oscuro */}
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
            <div className="font-mono text-[11px] uppercase tracking-[.14em] text-neutral-600 px-[2px]">
              Wallet del sistema
            </div>
            <div className="bg-neutral-100 rounded-2xl px-4 py-4 flex items-center gap-3">
              <CreditCard size={19} strokeWidth={2.75} className="text-neutral-700 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[15px] text-ink">Apple / Google Wallet</div>
                <div className="text-[12.5px] text-neutral-600 mt-[1px]">Exportar pases nativos</div>
              </div>
              <span className="text-[11.5px] font-extrabold px-[11px] py-[6px] rounded-full shrink-0 bg-sage-200 text-sage-800">
                Pronto
              </span>
            </div>
          </div>

          {/* ── pie ── */}
          <div className="text-center text-[12.5px] text-neutral-600 mt-auto pt-2">
            Fidely QR · v0.4 ·{' '}
            <button className="underline underline-offset-2">Términos</button>
          </div>
        </div>
      </div>

      <BottomNav active="perfil" />
    </div>
  );
}
