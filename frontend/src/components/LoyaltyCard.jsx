import { Link } from 'react-router-dom';
import { Check, CheckCheck, ChevronRight } from 'lucide-react';

export default function LoyaltyCard({ customerCard }) {
  const cd      = customerCard.loyalty_card || customerCard.cardInline || customerCard;
  const biz     = customerCard.business     || cd.business;

  const primary   = cd.primary_color   || biz?.primary_color   || '#c67139';
  const secondary = cd.secondary_color || biz?.secondary_color || '#f5ead8';

  const total     = cd.total_stamps ?? 0;
  const stamps    = customerCard.stamps ?? 0;
  const pct       = total > 0 ? Math.round((stamps / total) * 100) : 0;
  const completed = stamps >= total && total > 0;
  const claimed   = customerCard.status === 'reward_claimed';

  const bizName   = biz?.name || cd.name || 'Negocio';
  const reward    = cd.reward             || 'Recompensa';
  const initial   = bizName.charAt(0).toUpperCase();
  const logoUrl   = cd.logo_url || biz?.logo_url;

  // ── CANJEADA ─────────────────────────────────────────────────────────────
  if (claimed) {
    return (
      <div className="rounded-2xl overflow-hidden opacity-70" style={{ background: '#e8e3dd' }}>
        <div className="px-[18px] py-4 flex items-center gap-3">
          <div className="w-[38px] h-[38px] rounded-[14px] shrink-0 grid place-items-center font-display text-[17px]"
            style={{ background: '#ccc7c2', color: '#a09a96' }}>
            {logoUrl
              ? <img src={logoUrl} className="w-full h-full rounded-[14px] object-cover" alt={bizName} />
              : initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-[15px] text-neutral-700 leading-tight truncate">{bizName}</div>
            <div className="text-[12.5px] text-neutral-700 mt-[2px]">Canjeada · {reward}</div>
          </div>
          <CheckCheck size={18} strokeWidth={2.75} className="text-neutral-700 shrink-0" />
        </div>
      </div>
    );
  }

  // ── ACTIVA o COMPLETA ────────────────────────────────────────────────────
  return (
    <Link
      to={`/card/${customerCard.id}`}
      className="block rounded-2xl overflow-hidden shadow-md active:scale-[.98] transition-transform"
      style={{ background: primary }}>
      <div className="relative p-[18px] text-white">

        {/* círculo decorativo top-right */}
        <div className="absolute -top-[50px] -right-[40px] w-[160px] h-[160px] rounded-full pointer-events-none"
          style={{ background: secondary, opacity: 0.30 }} />

        {/* ── cabecera ── */}
        <div className="relative flex items-center gap-3 mb-[14px]">
          <div className="w-[42px] h-[42px] rounded-[15px] shrink-0 grid place-items-center font-display text-[19px] shadow-sm"
            style={{ background: secondary, color: primary }}>
            {logoUrl
              ? <img src={logoUrl} className="w-full h-full rounded-[15px] object-cover" alt={bizName} />
              : initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-[16px] text-white leading-tight truncate">{bizName}</div>
            <div className="text-[12.5px] opacity-75 truncate">{reward}</div>
          </div>

          {completed
            /* badge ¡Listo! — brand-300 bg con brand-900 text */
            ? <span className="shrink-0 text-[11.5px] font-extrabold py-[6px] px-[11px] rounded-full"
                style={{ background: 'rgba(245,234,216,.90)', color: primary }}>
                ¡Listo!
              </span>
            /* flecha para activas */
            : <ChevronRight size={18} strokeWidth={2.75} style={{ color: 'rgba(245,234,216,.6)' }} className="shrink-0" />
          }
        </div>

        {/* ── dots de sellos ── */}
        <div className="relative flex gap-[7px] flex-wrap mb-[14px]">
          {Array.from({ length: Math.min(total, 10) }).map((_, i) => {
            const done = i < stamps;
            return (
              <div key={i}
                className="w-[27px] h-[27px] rounded-full grid place-items-center text-[11px] font-bold"
                style={done
                  ? { background: secondary, color: primary }
                  : { border: '2px solid rgba(245,234,216,.35)', color: 'rgba(245,234,216,.55)' }}>
                {done
                  ? <Check size={14} strokeWidth={2.75} />
                  : i + 1}
              </div>
            );
          })}
        </div>

        {/* ── barra de progreso (solo activas) ── */}
        {!completed && (
          <div className="relative h-[6px] rounded-full overflow-hidden mb-2"
            style={{ background: 'rgba(245,234,216,.25)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: secondary }} />
          </div>
        )}

        {/* ── footer ── */}
        <div className="relative flex items-center justify-between text-[12.5px] font-bold"
          style={{ opacity: 0.85 }}>
          <span>{stamps} de {total} sellos</span>
          <span>{completed ? `Canjea tu ${reward.toLowerCase()}` : `${pct}%`}</span>
        </div>
      </div>
    </Link>
  );
}
