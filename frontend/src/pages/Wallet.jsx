import { useEffect, useState } from 'react';
import { Search, Bell, ScanLine, RefreshCw, Plus, Camera, Link2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { getDeviceId } from '../utils/device.js';
import LoyaltyCard from '../components/LoyaltyCard.jsx';
import BottomNav from '../components/BottomNav.jsx';
import Footer from '../components/Footer.jsx';

const FILTERS = ['Todas', 'Activas', 'Canjeadas'];

export default function Wallet() {
  const [wallet, setWallet]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState('Todas');
  const [search, setSearch]   = useState('');
  const [tick,   setTick]     = useState(0); // fuerza recarga
  const [fabOpen, setFabOpen] = useState(false);

  const navigate = useNavigate();
  const deviceId = getDeviceId();

  useEffect(() => {
    setLoading(true);
    setError('');
    (async () => {
      try {
        const data = await api.wallet(deviceId);
        setWallet(data.wallet || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [tick]); // eslint-disable-line

  function reload() { setTick(t => t + 1); }

  const active  = wallet.filter(c => c.status !== 'reward_claimed');
  const claimed = wallet.filter(c => c.status === 'reward_claimed');
  const readyCount = active.filter(c => {
    const cd = c.loyalty_card || c;
    const total = cd.total_stamps ?? 0;
    return c.stamps >= total && total > 0;
  }).length;

  let filtered = wallet;
  if (filter === 'Activas')   filtered = active;
  if (filter === 'Canjeadas') filtered = claimed;
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(c => {
      const name = c.business?.name || c.loyalty_card?.name || '';
      return name.toLowerCase().includes(q);
    });
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col font-sans">

      {/* ── cabecera ── */}
      <header className="px-5 pb-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}>
        <div className="max-w-md mx-auto flex flex-col gap-3">

          {/* logo Fidely → inicio */}
          <Link to="/" className="flex items-center gap-2 w-fit">
            <div className="w-8 h-8 rounded-xl bg-brand grid place-items-center">
              <ScanLine size={15} strokeWidth={2.75} className="text-white" />
            </div>
            <span className="font-display text-[19px] text-ink">Fidely</span>
          </Link>

        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-600 mb-1">
              Mi Wallet
            </p>
            <h1 className="font-display text-[34px] leading-none text-ink">
              Mis tarjetas
            </h1>
            {!loading && (
              <p className="text-neutral-600 text-sm mt-1">
                {wallet.length === 0
                  ? 'Escanea tu primer QR'
                  : `${wallet.length} tarjeta${wallet.length !== 1 ? 's' : ''}${
                      readyCount > 0
                        ? ` · ${readyCount} recompensa${readyCount !== 1 ? 's' : ''} lista${readyCount !== 1 ? 's' : ''}`
                        : ''
                    }`}
              </p>
            )}
          </div>

          <button
            className="w-[42px] h-[42px] rounded-full bg-neutral-200 flex items-center justify-center shrink-0 relative mt-1"
            aria-label="Notificaciones"
          >
            <Bell size={20} strokeWidth={2.75} className="text-neutral-700" />
            {readyCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand" />
            )}
          </button>
        </div>
        </div>
      </header>

      {/* ── buscador ── */}
      <div className="px-5 pb-3">
        <div className="max-w-md mx-auto relative">
          <Search
            size={16}
            strokeWidth={2.75}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar tarjeta…"
            className="w-full bg-neutral-200 rounded-full py-3 pl-10 pr-4 text-sm text-ink placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-brand/40 transition"
          />
        </div>
      </div>

      {/* ── filtros ── */}
      <div className="px-5 pb-5">
        <div className="max-w-md mx-auto flex gap-2">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'border border-neutral-400 text-neutral-600 bg-transparent'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── contenido ── */}
      <main className="flex-1 px-4 max-w-md mx-auto w-full"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}>
        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            <p className="text-neutral-500 text-sm">Cargando tu wallet…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-5">
            <div className="w-20 h-20 bg-neutral-200 rounded-2xl flex items-center justify-center text-4xl">
              💳
            </div>
            <div className="max-w-xs">
              <p className="text-ink font-semibold text-[17px]">
                {wallet.length === 0 ? 'Tu wallet está vacía' : 'Sin resultados'}
              </p>
              <p className="text-neutral-600 text-sm mt-2 leading-[1.5]">
                {wallet.length === 0
                  ? 'Escanea el QR de bienvenida de un negocio para añadir tu primera tarjeta de fidelización.'
                  : 'Prueba con otro filtro o búsqueda.'}
              </p>
              {wallet.length === 0 && (
                <p className="text-neutral-500 text-[12.5px] mt-3 leading-[1.5]">
                  Si ya escaneaste un QR, asegúrate de usar el mismo navegador y dispositivo en que lo hiciste.
                </p>
              )}
            </div>
            {wallet.length === 0 && (
              <button
                onClick={reload}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-[11px] rounded-full bg-neutral-200 text-neutral-700 font-semibold text-[14px] transition active:scale-[.97] disabled:opacity-50">
                <RefreshCw size={15} strokeWidth={2.75} className={loading ? 'animate-spin' : ''} />
                Recargar
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(cc => (
              <LoyaltyCard key={cc.id} customerCard={cc} />
            ))}
          </div>
        )}
      </main>

      {/* ── backdrop para cerrar el speed-dial ── */}
      {fabOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setFabOpen(false)} />
      )}

      {/* ── speed-dial FAB ── */}
      <div className="fixed z-20 right-5 flex flex-col items-end gap-[14px]"
        style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 78px)' }}>

        {/* sub-opciones (aparecen encima del botón principal) */}
        <div className={`flex flex-col items-end gap-[14px] transition-all duration-200 origin-bottom
          ${fabOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}>

          {/* opción 1 — escanear QR */}
          <div className="flex items-center gap-3">
            <span className="bg-neutral-900 text-white text-[13px] font-semibold px-[14px] py-[7px] rounded-full shadow-md whitespace-nowrap">
              Escanear QR
            </span>
            <button
              onClick={() => { setFabOpen(false); navigate('/add-card?tab=scan'); }}
              className="w-[52px] h-[52px] rounded-full shadow-md flex items-center justify-center transition active:scale-95"
              style={{ background: '#7a8a5e' }}>
              <Camera size={21} strokeWidth={2.75} className="text-white" />
            </button>
          </div>

          {/* opción 2 — pegar link */}
          <div className="flex items-center gap-3">
            <span className="bg-neutral-900 text-white text-[13px] font-semibold px-[14px] py-[7px] rounded-full shadow-md whitespace-nowrap">
              Pegar link
            </span>
            <button
              onClick={() => { setFabOpen(false); navigate('/add-card?tab=link'); }}
              className="w-[52px] h-[52px] rounded-full bg-neutral-700 shadow-md flex items-center justify-center transition active:scale-95">
              <Link2 size={21} strokeWidth={2.75} className="text-white" />
            </button>
          </div>
        </div>

        {/* botón principal "+" */}
        <button
          onClick={() => setFabOpen(o => !o)}
          aria-label="Añadir tarjeta"
          className="w-[58px] h-[58px] rounded-full bg-brand shadow-lg flex items-center justify-center transition-all active:scale-95 hover:bg-brand-600">
          <Plus
            size={26}
            strokeWidth={2.75}
            className={`text-white transition-transform duration-200 ${fabOpen ? 'rotate-45' : 'rotate-0'}`}
          />
        </button>
      </div>

      <BottomNav active="wallet" />
      <Footer />
    </div>
  );
}
