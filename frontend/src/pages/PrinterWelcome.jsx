import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { getDeviceId } from '../utils/device.js';

// Página de bienvenida al escanear el QR incluido en el material del negocio.
// Body { loyalty_card_id, device_id, name } crea la tarjeta en la wallet del cliente.
export default function PrinterWelcome() {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.welcome({
          loyalty_card_id: cardId,
          device_id: getDeviceId(),
        });
        setInfo({ card: data.loyalty_card });
        setStatus('ok');
        setTimeout(() => navigate('/wallet'), 2500);
      } catch (e) {
        if (e.code === 'ALREADY_OWNED') {
          setStatus('ok');
          setInfo({ card: null, already: true });
          setTimeout(() => navigate('/wallet'), 2500);
        } else {
          setError(e.message);
          setStatus('error');
        }
      }
    })();
  }, [cardId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-800 to-gray-900 text-white flex items-center justify-center p-6">
      <div className="text-center">
        {status === 'loading' && <p className="text-gray-300">Añadiendo tarjeta a tu wallet...</p>}

        {status === 'ok' && (
          <>
            <p className="text-6xl mb-4">{info?.already ? '💳' : '🎉'}</p>
            <h1 className="text-2xl font-bold mb-2">
              {info?.already ? 'Ya tienes esta tarjeta' : '¡Tarjeta añadida!'}
            </h1>
            <p className="text-gray-300">
              {info?.already
                ? 'La encontrarás en tu wallet.'
                : `Tu tarjeta de ${info?.card?.name || 'fidelización'} está en Mi Wallet.`}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="text-red-400 mb-4">{error}</p>
            <Link to="/" className="text-blue-300 underline">Volver al inicio</Link>
          </>
        )}
      </div>
    </div>
  );
}
