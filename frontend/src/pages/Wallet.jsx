import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { getDeviceId } from '../utils/device.js';
import LoyaltyCard from '../components/LoyaltyCard.jsx';
import Footer from '../components/Footer.jsx';
import { useLang } from '../i18n/index.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';

export default function Wallet() {
  const { t } = useLang();
  const [wallet, setWallet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const deviceId = getDeviceId();
        const data = await api.wallet(deviceId);
        setWallet(data.wallet || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const active = wallet.filter((c) => c.status !== 'reward_claimed');
  const claimed = wallet.filter((c) => c.status === 'reward_claimed');

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">

      {/* header */}
      <header className="bg-gray-950 px-5 pt-10 pb-6">
        <div className="max-w-md mx-auto flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-1">Mi Wallet</p>
            <h1 className="text-3xl font-black text-white leading-tight">
              Mis Tarjetas
            </h1>
            {!loading && (
              <p className="text-gray-500 text-sm mt-1">
                {wallet.length === 0
                  ? 'Sin tarjetas aún'
                  : `${wallet.length} tarjeta${wallet.length !== 1 ? 's' : ''}`}
              </p>
            )}
          </div>
          <LanguageSwitcher dark />
        </div>
      </header>

      {/* contenido */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 pb-6 space-y-6">

        {error && (
          <div className="bg-red-900/40 text-red-300 border border-red-800 p-3 rounded-2xl text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Cargando tu wallet...</p>
          </div>
        ) : wallet.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-20 h-20 bg-gray-800 rounded-3xl flex items-center justify-center text-4xl">
              💳
            </div>
            <div>
              <p className="text-white font-bold text-lg">Tu wallet está vacía</p>
              <p className="text-gray-500 text-sm mt-1 max-w-xs">
                Escanea el QR de bienvenida de un negocio para añadir tu primera tarjeta.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* tarjetas activas */}
            {active.length > 0 && (
              <section className="space-y-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest px-1">
                  Activas
                </p>
                {active.map((cc) => (
                  <LoyaltyCard key={cc.id} customerCard={cc} />
                ))}
              </section>
            )}

            {/* tarjetas canjeadas */}
            {claimed.length > 0 && (
              <section className="space-y-4">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest px-1">
                  Canjeadas
                </p>
                <div className="opacity-60">
                  {claimed.map((cc) => (
                    <LoyaltyCard key={cc.id} customerCard={cc} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <Link
          to="/"
          className="block text-center text-sm text-gray-600 hover:text-gray-400 transition-colors py-2"
        >
          Volver al inicio
        </Link>
      </main>

      <Footer />
    </div>
  );
}
