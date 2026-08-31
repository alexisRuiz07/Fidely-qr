import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api.js';
import { getDeviceId } from '../utils/device.js';
import BackButton from '../components/BackButton.jsx';

export default function WatchQr() {
  const { cardId } = useParams();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.wallet(getDeviceId());
        const found = (data.wallet || []).find((c) => c.id === cardId);
        if (!found) throw new Error('Tarjeta no encontrada');
        setCard(found);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [cardId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Tarjeta no encontrada'}</p>
          <Link to="/wallet" className="text-amber-400 underline text-sm">Volver a Mi Wallet</Link>
        </div>
      </div>
    );
  }

  const cardData = card.loyalty_card || {};
  const biz = card.business || {};
  const primary = cardData.primary_color || biz?.primary_color || '#1f2937';
  const secondary = cardData.secondary_color || biz?.secondary_color || '#f59e0b';
  const total = cardData.total_stamps ?? 0;
  const stamps = card.stamps ?? 0;
  const pct = total > 0 ? Math.round((stamps / total) * 100) : 0;
  const completed = stamps >= total && total > 0;
  const bizName = biz?.name || cardData.name || 'Negocio';

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">

      {/* barra superior */}
      <div className="flex items-center justify-between px-5 pt-10 pb-4">
        <BackButton to="/wallet" label="Mi Wallet" />
      </div>

      {/* encabezado de la tarjeta con colores del negocio */}
      <div
        className="mx-4 rounded-3xl p-5 mb-6 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primary}, ${primary}bb)` }}
      >
        {/* círculos decorativos */}
        <div className="absolute top-0 right-0 w-36 h-36 rounded-full opacity-10 -translate-y-1/4 translate-x-1/4"
          style={{ background: secondary }} />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10 translate-y-1/3 -translate-x-1/4"
          style={{ background: secondary }} />

        {/* info del negocio */}
        <div className="relative flex items-center gap-3 mb-4">
          {cardData.logo_url || biz?.logo_url ? (
            <img src={cardData.logo_url || biz?.logo_url} alt={bizName}
              className="w-12 h-12 rounded-2xl object-cover bg-white/20" />
          ) : (
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black"
              style={{ background: secondary, color: '#111827' }}>
              {bizName.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-black text-lg">{bizName}</p>
            {cardData.name && cardData.name !== bizName && (
              <p className="text-sm text-white/60">{cardData.name}</p>
            )}
          </div>
        </div>

        {/* progreso */}
        <div className="relative space-y-2">
          <div className="flex justify-between text-sm text-white/80">
            <span>{stamps} de {total} sellos</span>
            <span className="font-bold">{pct}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: secondary }} />
          </div>
        </div>

        {completed && card.status !== 'reward_claimed' && (
          <div className="relative mt-3 text-center">
            <span className="inline-block text-xs font-bold py-1.5 px-4 rounded-full"
              style={{ background: secondary, color: '#111827' }}>
              🎉 ¡Recompensa disponible! — {cardData.reward}
            </span>
          </div>
        )}
      </div>

      {/* QR */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-5">
        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <QRCodeSVG
            value={card.qr_token}
            size={220}
            fgColor="#111827"
            bgColor="#ffffff"
            level="M"
          />
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-white">Muestra este QR al empleado</p>
          <p className="text-xs text-gray-500">
            El empleado lo escaneará para registrar tu sello.
          </p>
        </div>
      </div>

      <div className="pb-10" />
    </div>
  );
}
