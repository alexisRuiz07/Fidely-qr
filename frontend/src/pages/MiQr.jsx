import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { QrCode, ScanLine, ChevronRight } from 'lucide-react';
import { api } from '../services/api.js';
import { getDeviceId } from '../utils/device.js';
import BottomNav from '../components/BottomNav.jsx';

export default function MiQr() {
  const navigate = useNavigate();
  const [cards,   setCards]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.wallet(getDeviceId());
        const all  = (data.wallet || []).filter(c => c.status !== 'reward_claimed');
        setCards(all);
      } catch {
        /* silencioso — mostramos estado vacío */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const primary = (card) => {
    const cd  = card.loyalty_card || card;
    const biz = card.business     || cd.business;
    return cd.primary_color || biz?.primary_color || '#c67139';
  };

  const secondary = (card) => {
    const cd  = card.loyalty_card || card;
    const biz = card.business     || cd.business;
    return cd.secondary_color || biz?.secondary_color || '#f5ead8';
  };

  const bizName = (card) => {
    const cd  = card.loyalty_card || card;
    const biz = card.business     || cd.business;
    return biz?.name || cd.name || 'Negocio';
  };

  const stamps = (card) => card.stamps ?? 0;
  const total  = (card) => (card.loyalty_card || card).total_stamps ?? 0;

  return (
    <div className="min-h-dvh bg-bg font-sans flex flex-col">

      {/* cabecera */}
      <header className="px-5 pb-5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}>
        <div className="max-w-md mx-auto flex flex-col gap-3">

          {/* logo Fidely → inicio */}
          <Link to="/" className="flex items-center gap-2 w-fit">
            <div className="w-8 h-8 rounded-xl bg-brand grid place-items-center">
              <ScanLine size={15} strokeWidth={2.75} className="text-white" />
            </div>
            <span className="font-display text-[19px] text-ink">Fidely</span>
          </Link>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-600 mb-1">
              Mi Wallet
            </p>
            <h1 className="font-display text-[34px] leading-none text-ink">
              Mi QR
            </h1>
            <p className="text-[14px] text-neutral-600 mt-2">
              Elige una tarjeta para mostrar su código al empleado
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}>
        <div className="max-w-md mx-auto">

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            </div>

          ) : cards.length === 0 ? (
            /* ── Estado vacío ── */
            <div className="flex flex-col items-center text-center gap-6 py-16">
              <div className="relative">
                <div className="w-28 h-28 rounded-2xl bg-neutral-200 grid place-items-center">
                  <QrCode size={52} strokeWidth={2} className="text-neutral-400" />
                </div>
                <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-xl bg-brand grid place-items-center shadow-md">
                  <ScanLine size={22} strokeWidth={2.75} className="text-white" />
                </div>
              </div>

              <div className="max-w-xs">
                <h2 className="font-display text-[24px] text-ink leading-tight mb-2">
                  Aún no tienes tarjetas
                </h2>
                <p className="text-[14.5px] text-neutral-600 leading-[1.5]">
                  Escanea el código QR de bienvenida de un negocio para añadir tu primera tarjeta de fidelización. El código suele estar en el mostrador o en la mesa.
                </p>
              </div>

              <div className="w-full max-w-xs bg-neutral-200 rounded-2xl p-5 text-left">
                <div className="font-mono text-[10.5px] uppercase tracking-[.12em] text-neutral-600 mb-2">
                  ¿Cómo funciona?
                </div>
                {[
                  { n: '1', t: 'Escanea el QR del negocio' },
                  { n: '2', t: 'Añade la tarjeta a tu wallet' },
                  { n: '3', t: 'Muestra tu QR en cada visita' },
                ].map(({ n, t }) => (
                  <div key={n} className="flex items-center gap-3 py-2">
                    <div className="w-7 h-7 rounded-full bg-brand grid place-items-center text-white font-extrabold text-[12px] shrink-0">
                      {n}
                    </div>
                    <span className="text-[14px] text-ink font-medium">{t}</span>
                  </div>
                ))}
              </div>
            </div>

          ) : (
            /* ── Lista de tarjetas activas ── */
            <div className="flex flex-col gap-3 pt-1">
              {cards.map(card => {
                const p  = primary(card);
                const s  = secondary(card);
                const n  = bizName(card);
                const st = stamps(card);
                const to = total(card);
                const init = n.charAt(0).toUpperCase();
                const logoUrl = (card.loyalty_card || card).logo_url || card.business?.logo_url;

                return (
                  <button
                    key={card.id}
                    onClick={() => navigate(`/card/${card.id}`)}
                    className="w-full flex items-center gap-4 rounded-2xl p-4 text-left transition active:scale-[.98]"
                    style={{ background: p }}>

                    {/* avatar */}
                    <div className="w-[50px] h-[50px] rounded-[18px] grid place-items-center font-display text-[22px] shrink-0 shadow-sm"
                      style={{ background: s, color: p }}>
                      {logoUrl
                        ? <img src={logoUrl} className="w-full h-full rounded-[18px] object-cover" alt={n} />
                        : init}
                    </div>

                    {/* info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-white text-[16px] leading-tight truncate">{n}</div>
                      <div className="text-[13px] mt-[3px]" style={{ color: 'rgba(245,234,216,.75)' }}>
                        {st} de {to} sellos{st >= to && to > 0 ? ' · ¡Lista!' : ''}
                      </div>
                    </div>

                    {/* flecha */}
                    <div className="shrink-0 w-9 h-9 rounded-full grid place-items-center"
                      style={{ background: 'rgba(245,234,216,.22)' }}>
                      <QrCode size={18} strokeWidth={2.75} className="text-white" />
                    </div>
                  </button>
                );
              })}

              <p className="text-center text-[12.5px] text-neutral-600 pt-2">
                Toca una tarjeta para ver su QR
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav active="qr" />
    </div>
  );
}
