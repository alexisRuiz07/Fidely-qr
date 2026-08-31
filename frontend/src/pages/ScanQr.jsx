import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../services/api.js';

const stages = { idle: 'idle', validated: 'validated', stamped: 'stamped', redeemed: 'redeemed' };

export default function ScanQr() {
  const navigate = useNavigate();
  const [stage, setStage] = useState(stages.idle);
  const [tokenInput, setTokenInput] = useState('');
  const [token, setToken] = useState(''); // token del QR escaneado/pegado
  const [context, setContext] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState('');
  const scannerRef = useRef(null);
  const html5Ref = useRef(null);
  const stopRef = useRef(false);

  // Limpia la cámara al desmontar
  useEffect(() => {
    return () => {
      stopRef.current = true;
      html5Ref.current?.stop().catch(() => {});
      html5Ref.current = null;
    };
  }, []);

  function logout() {
    stopCamera();
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    navigate('/');
  }

  function stopCamera() {
    setCamOn(false);
    if (html5Ref.current) {
      html5Ref.current.stop().catch(() => {});
      html5Ref.current = null;
    }
  }

  async function startCamera() {
    setCamError('');
    stopCamera();
    setCamOn(true);
    const scanner = new Html5Qrcode(scannerRef.current.id);
    html5Ref.current = scanner;

    const onFound = async (decodedText) => {
      const value = (decodedText || '').trim();
      if (!value || stopRef.current) return;
      stopCamera();
      await validate(value);
    };

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => onFound(text),
        () => {}
      );
    } catch (e) {
      setCamError('No se pudo acceder a la cámara: ' + e.message);
      setCamOn(false);
      html5Ref.current = null;
    }
  }

  async function validate(value) {
    if (!value) return;
    setBusy(true);
    setError('');
    try {
      const data = await api.validateToken(value);
      setToken(value);
      setTokenInput(value);
      setContext(data);
      setStage(stages.validated);
    } catch (e) {
      setStage(stages.idle);
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function addStamp() {
    setBusy(true);
    setError('');
    try {
      const data = await api.addStamp(token);
      setContext({
        ...context,
        card: { ...context.card, stamps: data.stamps, status: data.status, completed: data.completed },
      });
      setStage(data.completed ? stages.validated : stages.stamped);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function redeem() {
    setBusy(true);
    setError('');
    try {
      await api.redeem(token);
      setContext({ ...context, card: { ...context.card, status: 'reward_claimed' } });
      setStage(stages.redeemed);
      setTimeout(() => {
        setStage(stages.idle);
        setContext(null);
        setToken('');
        setTokenInput('');
      }, 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    stopCamera();
    setStage(stages.idle);
    setContext(null);
    setToken('');
    setTokenInput('');
    setError('');
  }

  const total = context?.card?.total_stamps ?? 0;
  const stamps = context?.card?.stamps ?? 0;
  const completed = context?.card?.completed;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
      {/* Header */}
      <div className="w-full max-w-sm flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Escáner</h1>
        <button onClick={logout} className="text-sm text-gray-400 underline">Salir</button>
      </div>

      {/* STEP 1: capturar token con cámara o manual */}
      {stage === stages.idle && (
        <div className="w-full max-w-sm space-y-4">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-800 flex items-center justify-center">
            {camOn && !camError ? (
              <div id="qr-reader" ref={scannerRef} className="w-full h-full" />
            ) : (
              <div className="text-center text-6xl">📷</div>
            )}
            {camError && (
              <div className="absolute inset-0 bg-gray-900/90 flex items-center justify-center p-4 text-center text-red-400 text-sm">
                {camError}
              </div>
            )}
          </div>

          {!camOn && (
            <button
              onClick={startCamera}
              className="w-full bg-amber-400 text-gray-900 font-bold py-3 rounded-xl"
            >
              ESCANEAR QR
            </button>
          )}
          {camOn && !camError && (
            <button
              onClick={stopCamera}
              className="w-full bg-white/10 font-bold py-3 rounded-xl"
            >
              Detener cámara
            </button>
          )}

          <div className="bg-white/5 rounded-xl p-4">
            <label className="text-xs text-gray-400">O pega el token del QR manualmente</label>
            <div className="flex gap-2 mt-2">
              <input
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Token..."
                className="flex-1 bg-white/10 p-2 rounded-lg text-sm placeholder-gray-500"
              />
              <button
                onClick={() => validate(tokenInput)}
                disabled={busy || !tokenInput}
                className="bg-amber-400 text-gray-900 font-bold px-4 rounded-lg disabled:opacity-50"
              >
                Validar
              </button>
            </div>
          </div>

          {error && <div className="bg-red-100 text-red-700 p-3 rounded-xl text-sm">{error}</div>}
        </div>
      )}

      {/* STEP 2: contexto validado */}
      {stage === stages.validated && context && (
        <div className="w-full max-w-sm space-y-4">
          <div className="bg-white text-gray-900 rounded-2xl p-5">
            <p className="text-sm text-gray-500">Cliente: <span className="font-bold text-gray-900">{context.customer?.name || '—'}</span></p>
            <p className="text-sm text-gray-500">Negocio: <span className="font-bold text-gray-900">{context.card.name}</span></p>
            <p className="mt-3 text-2xl font-bold">{stamps} / {total} sellos</p>
            <div className="flex gap-1 mt-2">
              {Array.from({ length: total }).map((_, i) => (
                <span key={i} className={`h-5 w-5 rounded-full ${i < stamps ? 'bg-amber-400' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>

          {error && <div className="bg-red-100 text-red-700 p-3 rounded-xl text-sm">{error}</div>}

          {completed && context.card.status !== 'reward_claimed' && (
            <div className="bg-amber-400 text-gray-900 rounded-2xl p-4 text-center font-bold">
              🎉 Recompensa disponible: {context.card.reward}
            </div>
          )}

          {context.card.status === 'reward_claimed' ? (
            <div className="bg-green-100 text-green-800 rounded-2xl p-4 text-center font-bold">
              ✓ Recompensa ya canjeada en esta tarjeta
            </div>
          ) : (
            <button
              onClick={addStamp}
              disabled={busy}
              className="w-full bg-amber-400 text-gray-900 font-bold py-3 rounded-xl disabled:opacity-50"
            >
              {busy ? 'Procesando...' : 'REGISTRAR SELLO'}
            </button>
          )}

          {completed && context.card.status !== 'reward_claimed' && (
            <button
              onClick={redeem}
              disabled={busy}
              className="w-full bg-green-500 text-white font-bold py-3 rounded-xl disabled:opacity-50"
            >
              CANJEAR RECOMPENSA
            </button>
          )}

          <button onClick={reset}
            className="w-full text-sm text-gray-400 underline py-2">
            Escanear otro
          </button>
        </div>
      )}

      {/* STEP 3: sello registrado */}
      {stage === stages.stamped && context && (
        <div className="w-full max-w-sm text-center space-y-3">
          <p className="text-6xl text-green-400">✓</p>
          <p className="text-xl font-bold text-green-400">SELLO REGISTRADO</p>
          <p className="text-3xl font-bold">{stamps} / {total}</p>
          <button onClick={reset} className="w-full bg-amber-400 text-gray-900 font-bold py-3 rounded-xl">
            Listo
          </button>
        </div>
      )}

      {/* STEP 4: recompensa canjeada */}
      {stage === stages.redeemed && (
        <div className="w-full max-w-sm text-center space-y-3">
          <p className="text-6xl">🎉</p>
          <p className="text-xl font-bold text-green-400">RECOMPENSA CANJEADA</p>
          <p className="text-gray-300">La recompensa fue marcada como utilizada y no podrá reutilizarse.</p>
          <button onClick={reset} className="w-full bg-amber-400 text-gray-900 font-bold py-3 rounded-xl">
            Escanear otro
          </button>
        </div>
      )}
    </div>
  );
}
