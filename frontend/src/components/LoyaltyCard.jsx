import { Link } from 'react-router-dom';

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function StampGrid({ stamps, total, secondary }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < stamps;
        return (
          <div
            key={i}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              filled
                ? 'shadow-md scale-105'
                : 'border-2 border-white/30'
            }`}
            style={filled ? { background: secondary, color: '#111827' } : {}}
          >
            {filled ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <span className="text-white/30 text-xs">{i + 1}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function LoyaltyCard({ customerCard }) {
  const cardData = customerCard.loyalty_card || customerCard.cardInline || customerCard;
  const biz = customerCard.business || cardData.business;
  const primary = cardData.primary_color || biz?.primary_color || '#1f2937';
  const secondary = cardData.secondary_color || biz?.secondary_color || '#f59e0b';

  const total = cardData.total_stamps ?? 0;
  const stamps = customerCard.stamps ?? 0;
  const pct = total > 0 ? Math.round((stamps / total) * 100) : 0;
  const completed = stamps >= total && total > 0;
  const claimed = customerCard.status === 'reward_claimed';

  const bizName = biz?.name || cardData.name || 'Negocio';
  const initial = bizName.charAt(0).toUpperCase();

  return (
    <Link
      to={`/card/${customerCard.id}`}
      className="block rounded-3xl overflow-hidden shadow-xl active:scale-[0.98] transition-transform"
      style={{
        background: `linear-gradient(135deg, ${primary} 0%, ${primary}dd 60%, ${primary}99 100%)`,
      }}
    >
      {/* patrón decorativo de fondo */}
      <div className="relative p-5 text-white">
        <div
          className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 -translate-y-1/4 translate-x-1/4"
          style={{ background: secondary }}
        />
        <div
          className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10 translate-y-1/3 -translate-x-1/4"
          style={{ background: secondary }}
        />

        {/* cabecera */}
        <div className="relative flex items-center gap-3 mb-4">
          {cardData.logo_url || biz?.logo_url ? (
            <img
              src={cardData.logo_url || biz?.logo_url}
              alt={bizName}
              className="w-12 h-12 rounded-2xl object-cover bg-white/20 shadow-md"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black shadow-md"
              style={{ background: secondary, color: '#111827' }}
            >
              {initial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-black text-lg leading-tight truncate">{bizName}</p>
            {cardData.name && cardData.name !== bizName && (
              <p className="text-sm text-white/70 truncate">{cardData.name}</p>
            )}
          </div>
          {/* badge estado */}
          {claimed && (
            <span className="shrink-0 text-xs bg-white/20 backdrop-blur-sm py-1 px-2.5 rounded-full font-semibold">
              ✓ Usado
            </span>
          )}
          {completed && !claimed && (
            <span
              className="shrink-0 text-xs py-1 px-2.5 rounded-full font-bold animate-pulse"
              style={{ background: secondary, color: '#111827' }}
            >
              🎉 ¡Listo!
            </span>
          )}
        </div>

        {/* recompensa */}
        <p className="relative text-xs text-white/60 mb-3 font-medium uppercase tracking-wide">
          Recompensa · {cardData.reward || '—'}
        </p>

        {/* sellos */}
        <div className="relative mb-4">
          <StampGrid stamps={stamps} total={total} secondary={secondary} />
        </div>

        {/* barra de progreso + contador */}
        <div className="relative space-y-1.5">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span className="font-semibold">{stamps} de {total} sellos</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: secondary }}
            />
          </div>
        </div>

        {/* footer de la tarjeta */}
        <div className="relative mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
          <p className="text-xs text-white/50">Toca para ver QR</p>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
