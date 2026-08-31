import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft, MoreHorizontal, Gift, Check,
  Stamp, Clock, MapPin,
} from 'lucide-react';
import { api } from '../services/api.js';
import { getDeviceId } from '../utils/device.js';

export default function WatchQr() {
  const { cardId } = useParams();
  const navigate   = useNavigate();
  const [card,    setCard]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data  = await api.wallet(getDeviceId());
        const found = (data.wallet || []).find(c => c.id === cardId);
        if (!found) throw new Error('Tarjeta no encontrada');
        setCard(found);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [cardId]);

  // ── LOADING ────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-dvh bg-bg flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── ERROR ──────────────────────────────────────────────────────────────
  if (error || !card) return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="text-neutral-700 text-[15px]">{error || 'Tarjeta no encontrada'}</p>
      <button onClick={() => navigate('/wallet')}
        className="text-brand-700 font-semibold underline text-[14px]">
        Volver a Mi Wallet
      </button>
    </div>
  );

  // ── datos del card ─────────────────────────────────────────────────────
  const cd        = card.loyalty_card || {};
  const biz       = card.business     || {};
  const primary   = cd.primary_color  || biz?.primary_color   || '#c67139';
  const total     = cd.total_stamps   ?? 0;
  const stamps    = card.stamps       ?? 0;
  const pct       = total > 0 ? Math.round((stamps / total) * 100) : 0;
  const completed = stamps >= total && total > 0;
  const claimed   = card.status === 'reward_claimed';
  const bizName   = biz?.name || cd.name || 'Negocio';
  const reward    = cd.reward || 'Recompensa';
  const token     = card.qr_token || '';

  // ── SCREEN 04: recompensa lista ────────────────────────────────────────
  if (completed && !claimed) return (
    <div className="min-h-dvh flex flex-col font-sans relative overflow-hidden"
      style={{ background: '#2d4a3e' }}>

      {/* círculo decorativo top-left */}
      <div className="absolute -top-[100px] -left-[80px] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: '#223a30' }} />
      {/* círculo decorativo bottom-right */}
      <div className="absolute -bottom-[120px] -right-[90px] w-[320px] h-[320px] rounded-full pointer-events-none"
        style={{ background: '#1e3329' }} />

      <div className="relative flex-1 flex flex-col px-6"
        style={{
          paddingTop:    'calc(env(safe-area-inset-top, 0px) + 28px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)',
          gap: 20,
        }}>

        {/* back */}
        <button onClick={() => navigate('/wallet')}
          className="self-start flex items-center gap-2 text-white/70 hover:text-white transition text-[14px] font-semibold">
          <ArrowLeft size={18} strokeWidth={2.75} />
          Mi Wallet
        </button>

        {/* icono regalo */}
        <div className="flex flex-col items-center text-center mt-2 gap-5">
          <div className="w-[104px] h-[104px] rounded-full grid place-items-center shadow-lg"
            style={{ background: 'rgba(245,234,216,.18)' }}>
            <Gift size={52} strokeWidth={2.75} style={{ color: 'rgba(245,234,216,.90)' }} />
          </div>

          <div className="flex flex-col gap-[8px]">
            <div className="font-mono text-[11px] uppercase tracking-[.14em]"
              style={{ color: 'rgba(245,234,216,.65)' }}>
              {bizName}
            </div>
            <h1 className="font-display font-normal leading-[1.05] text-white"
              style={{ fontSize: 'clamp(30px, 8vw, 38px)' }}>
              ¡Recompensa lista!
            </h1>
            <p className="text-[14.5px] leading-[1.5]" style={{ color: 'rgba(245,234,216,.75)' }}>
              Muestra este QR al empleado para canjear tu <strong className="text-white">{reward}</strong> gratis.
            </p>
          </div>
        </div>

        {/* panel QR */}
        <div className="rounded-2xl p-6 flex flex-col items-center gap-4"
          style={{ background: '#f5ead8' }}>
          <QRCodeSVG
            value={token}
            size={200}
            fgColor="#201e1d"
            bgColor="#f5ead8"
            level="M"
          />
          <div className="font-mono text-[11px] text-neutral-600 tracking-[.12em] uppercase">
            Token válido · {token.slice(-8).toUpperCase()}
          </div>
        </div>

        {/* botones */}
        <div className="mt-auto flex flex-col gap-3">
          <button
            onClick={() => navigate('/wallet')}
            className="w-full py-[17px] rounded-full font-extrabold text-[16px] transition"
            style={{ background: '#f5ead8', color: '#2d4a3e' }}>
            Ver mis tarjetas
          </button>
          <button
            className="w-full py-[15px] rounded-full font-semibold text-[15px] border-2 transition"
            style={{ borderColor: 'rgba(245,234,216,.35)', color: 'rgba(245,234,216,.75)' }}>
            Recordármelo después
          </button>
        </div>
      </div>
    </div>
  );

  // ── SCREEN 03: detalle y QR normal ────────────────────────────────────
  const fmtToken  = token ? token.slice(-12).toUpperCase().replace(/(.{4})/g, '$1 ').trim() : '—';
  const histItems = Array.from({ length: Math.min(stamps, 5) }, (_, i) => ({
    n:    stamps - i,
    time: i === 0 ? 'Hoy' : i === 1 ? 'Ayer' : `Hace ${i + 1} días`,
    branch: 'Sucursal Centro',
  }));

  return (
    <div className="min-h-dvh bg-bg font-sans flex flex-col">

      {/* ── barra de nav ── */}
      <div className="flex items-center justify-between px-4 pb-3 border-b border-neutral-300"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
        <button onClick={() => navigate('/wallet')}
          className="w-10 h-10 rounded-full bg-neutral-200 grid place-items-center text-neutral-700 hover:bg-neutral-300 transition shrink-0">
          <ArrowLeft size={18} strokeWidth={2.75} />
        </button>
        <div className="text-center flex-1 mx-3">
          <div className="font-extrabold text-[16px] text-ink leading-tight truncate">{bizName}</div>
          <div className="font-mono text-[10.5px] uppercase tracking-[.12em] text-neutral-600">{cd.name || 'Tarjeta'}</div>
        </div>
        <button className="w-10 h-10 rounded-full bg-neutral-200 grid place-items-center text-neutral-700 hover:bg-neutral-300 transition shrink-0">
          <MoreHorizontal size={18} strokeWidth={2.75} />
        </button>
      </div>

      {/* ── contenido (scrollable) ── */}
      <div className="flex-1 overflow-y-auto"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)' }}>
        <div className="max-w-sm mx-auto px-4 pt-5 flex flex-col gap-5">

          {/* ── panel QR ── */}
          <div className="bg-neutral-100 rounded-2xl p-5 flex flex-col items-center gap-4">
            <div className="font-mono text-[11px] uppercase tracking-[.13em] text-neutral-600">
              Muestra este código al empleado
            </div>

            <div className="bg-bg rounded-[18px] p-4 shadow-sm">
              <QRCodeSVG
                value={token}
                size={190}
                fgColor="#201e1d"
                bgColor="#f5ead8"
                level="M"
              />
            </div>

            <div className="flex flex-col items-center gap-[6px]">
              <div className="font-mono text-[16px] font-bold text-ink tracking-[.14em]">
                {fmtToken}
              </div>
              <div className="flex items-center gap-[6px] bg-sage-100 px-3 py-[5px] rounded-full">
                <Check size={13} strokeWidth={2.75} className="text-sage-700" />
                <span className="text-[12px] font-semibold text-sage-800">Token único · válido ahora</span>
              </div>
            </div>
          </div>

          {/* ── panel progreso ── */}
          <div className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: '#ebddc5' }}>
            {/* círculo deco */}
            <div className="absolute -top-[50px] -right-[40px] w-[160px] h-[160px] rounded-full pointer-events-none"
              style={{ background: primary, opacity: 0.14 }} />

            <div className="relative flex items-center justify-between mb-4">
              <span className="font-extrabold text-[15px] text-ink">Tu progreso</span>
              <span className="text-[13px] text-neutral-700 font-mono">{stamps}/{total} sellos</span>
            </div>

            {/* dots */}
            <div className="relative flex flex-wrap gap-[8px] mb-4">
              {Array.from({ length: total }).map((_, i) => {
                const done = i < stamps;
                const isReward = i === total - 1;
                return (
                  <div key={i}
                    className="w-[34px] h-[34px] rounded-full grid place-items-center text-[12px] font-bold transition-all"
                    style={done
                      ? { background: primary, color: '#fff' }
                      : isReward
                        ? { border: `2px dashed ${primary}`, color: primary, background: 'transparent' }
                        : { border: '2px dashed rgba(32,30,29,.25)', color: 'rgba(32,30,29,.4)', background: 'transparent' }}>
                    {done
                      ? isReward
                        ? <Gift size={14} strokeWidth={2.75} />
                        : <Check size={14} strokeWidth={2.75} />
                      : isReward
                        ? <Gift size={14} strokeWidth={2.75} style={{ opacity: 0.5 }} />
                        : i + 1}
                  </div>
                );
              })}
            </div>

            {/* barra de progreso */}
            <div className="h-[6px] rounded-full bg-neutral-300 overflow-hidden mb-3">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: primary }} />
            </div>

            <div className="flex items-center justify-between text-[13px] text-neutral-700">
              <span>{total - stamps > 0 ? `${total - stamps} sellos para ${reward}` : `¡Lista tu ${reward}!`}</span>
              <span className="font-bold">{pct}%</span>
            </div>
          </div>

          {/* ── historial ── */}
          {histItems.length > 0 && (
            <div className="flex flex-col gap-[10px]">
              <div className="font-extrabold text-[14px] text-ink px-1">Historial</div>
              <div className="flex flex-col gap-[6px]">
                {histItems.map(h => (
                  <div key={h.n}
                    className="bg-neutral-100 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full grid place-items-center shrink-0"
                      style={{ background: primary + '22' }}>
                      <Stamp size={15} strokeWidth={2.75} style={{ color: primary }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[13.5px] text-ink">
                        Sello {h.n} registrado
                      </div>
                      <div className="flex items-center gap-[10px] text-[11.5px] text-neutral-600 mt-[2px]">
                        <span className="flex items-center gap-[3px]">
                          <Clock size={10} strokeWidth={2.75} />
                          {h.time}
                        </span>
                        <span className="flex items-center gap-[3px]">
                          <MapPin size={10} strokeWidth={2.75} />
                          {h.branch}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* canjeada */}
          {claimed && (
            <div className="bg-neutral-100 rounded-2xl p-4 text-center">
              <div className="font-semibold text-[14px] text-neutral-600">
                Recompensa canjeada · tarjeta completada
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
