import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Keyboard, Zap, ArrowLeft, Check, Stamp, Gift, LogOut } from 'lucide-react';
import { api } from '../services/api.js';

const stages = { idle: 'idle', validated: 'validated', stamped: 'stamped', redeemed: 'redeemed' };

export default function ScanQr() {
  const navigate = useNavigate();
  const [stage,      setStage]      = useState(stages.idle);
  const [tokenInput, setTokenInput] = useState('');
  const [token,      setToken]      = useState('');
  const [context,    setContext]    = useState(null);
  const [error,      setError]      = useState('');
  const [busy,       setBusy]       = useState(false);
  const [camOn,      setCamOn]      = useState(false);
  const [camError,   setCamError]   = useState('');
  const [showManual, setShowManual] = useState(false);
  const scannerRef = useRef(null);
  const html5Ref   = useRef(null);
  const stopRef    = useRef(false);

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
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (text) => {
          const value = (text || '').trim();
          if (!value || stopRef.current) return;
          stopCamera();
          await validate(value);
        },
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
    setShowManual(false);
  }

  const total     = context?.card?.total_stamps ?? 0;
  const stamps    = context?.card?.stamps ?? 0;
  const completed = context?.card?.completed;

  // ── ESCÁNER (pantalla oscura) ────────────────────────────────────────────
  if (stage === stages.idle) {
    return (
      <div className="min-h-dvh font-sans flex flex-col" style={{ background: '#1b1a17' }}>

        {/* safe-area top + header */}
        <div className="flex-none px-5 flex items-center justify-between text-white"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)', paddingBottom: 14 }}>
          <div>
            <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[.14em] opacity-55">
              Fidely QR · Empleado
            </div>
            <div className="font-extrabold text-[16px] sm:text-[17px] leading-tight">Escanear tarjeta</div>
          </div>
          <button onClick={logout}
            className="w-10 h-10 rounded-full grid place-items-center transition"
            style={{ background: 'rgba(255,255,255,.12)' }}>
            <LogOut size={18} strokeWidth={2.75} />
          </button>
        </div>

        {/* viewport de cámara — llena el espacio restante */}
        <div className="flex-1 mx-4 sm:mx-[22px] rounded-xl overflow-hidden relative"
          style={{
            background: 'repeating-linear-gradient(135deg,#2c2a25 0 14px,#252420 14px 28px)',
            minHeight: 240,
          }}>

          {/* preview real */}
          <div id="qr-reader" ref={scannerRef}
            className={`absolute inset-0 ${camOn ? 'opacity-100' : 'opacity-0'}`} />

          {/* brackets de QR */}
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="relative w-[200px] h-[200px] sm:w-[230px] sm:h-[230px]">
              <div className="absolute top-0 left-0 w-[46px] h-[46px] sm:w-[52px] sm:h-[52px] rounded-tl-[18px] sm:rounded-tl-[20px]"
                style={{ borderTop: '4px solid #c67139', borderLeft: '4px solid #c67139' }} />
              <div className="absolute top-0 right-0 w-[46px] h-[46px] sm:w-[52px] sm:h-[52px] rounded-tr-[18px] sm:rounded-tr-[20px]"
                style={{ borderTop: '4px solid #c67139', borderRight: '4px solid #c67139' }} />
              <div className="absolute bottom-0 left-0 w-[46px] h-[46px] sm:w-[52px] sm:h-[52px] rounded-bl-[18px] sm:rounded-bl-[20px]"
                style={{ borderBottom: '4px solid #c67139', borderLeft: '4px solid #c67139' }} />
              <div className="absolute bottom-0 right-0 w-[46px] h-[46px] sm:w-[52px] sm:h-[52px] rounded-br-[18px] sm:rounded-br-[20px]"
                style={{ borderBottom: '4px solid #c67139', borderRight: '4px solid #c67139' }} />
              {/* línea de escaneo */}
              <div className="absolute left-[12px] right-[12px] top-1/2 h-[3px] rounded-full animate-pulse"
                style={{ background: '#c67139', boxShadow: '0 0 16px #c67139' }} />
            </div>
          </div>

          {/* error de cámara */}
          {camError && (
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-red-400 text-sm"
              style={{ background: 'rgba(27,26,23,.88)' }}>
              {camError}
            </div>
          )}

          {/* texto inferior */}
          <div className="absolute bottom-4 left-4 right-4 text-center text-[12.5px] sm:text-[13.5px]"
            style={{ color: 'rgba(255,255,255,.7)' }}>
            Apunta al QR del cliente
          </div>
        </div>

        {/* controles inferiores */}
        <div className="flex-none px-4 sm:px-[22px] pt-4 flex flex-col gap-[10px]"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>

          {/* manual toggle */}
          <button onClick={() => setShowManual(v => !v)}
            className="flex items-center gap-[10px] px-4 sm:px-[18px] py-[13px] rounded-full font-mono text-[12px] sm:text-[13px] transition w-full"
            style={{ background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.55)' }}>
            <Keyboard size={16} strokeWidth={2.75} />
            o pega el token manualmente
          </button>

          {showManual && (
            <div className="flex gap-2">
              <input
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="Token del QR..."
                className="flex-1 rounded-full px-4 py-[11px] text-[14px] outline-none"
                style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }}
              />
              <button
                onClick={() => validate(tokenInput)}
                disabled={busy || !tokenInput}
                className="bg-brand-600 text-white font-bold px-5 rounded-full text-sm disabled:opacity-50 transition">
                Validar
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
          )}

          {/* botón principal + flash */}
          <div className="flex gap-[10px]">
            <button
              onClick={camOn ? stopCamera : startCamera}
              disabled={busy}
              className="flex-1 bg-brand hover:bg-brand-600 text-white font-extrabold text-[15px] sm:text-[16px] py-[15px] sm:py-[17px] rounded-full flex items-center justify-center gap-[9px] transition disabled:opacity-50 shadow-md">
              {busy
                ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <>
                    <Camera size={18} strokeWidth={2.75} />
                    {camOn ? 'Detener' : 'Escanear'}
                  </>}
            </button>
            <button
              className="w-[52px] sm:w-[58px] rounded-full grid place-items-center text-white transition"
              style={{ border: '1.5px solid rgba(255,255,255,.28)' }}>
              <Zap size={18} strokeWidth={2.75} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RESULTADO (pantalla clara) ───────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-bg font-sans flex flex-col"
      style={{
        paddingTop:    'calc(env(safe-area-inset-top,    0px) + 12px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        paddingLeft:   'max(env(safe-area-inset-left,   0px), 20px)',
        paddingRight:  'max(env(safe-area-inset-right,  0px), 20px)',
      }}>

      <div className="flex-1 flex flex-col gap-4 max-w-sm mx-auto w-full">

        {/* header resultado */}
        <div className="flex items-center gap-[10px]">
          <button onClick={reset}
            className="w-[38px] h-[38px] rounded-full bg-neutral-200 grid place-items-center text-neutral-800 hover:bg-neutral-300 transition shrink-0">
            <ArrowLeft size={18} strokeWidth={2.75} />
          </button>
          <span className="font-extrabold text-[15px] text-ink">
            {stage === stages.stamped  && 'Sello registrado'}
            {stage === stages.redeemed && 'Recompensa canjeada'}
            {stage === stages.validated && 'Tarjeta encontrada'}
          </span>
        </div>

        {/* banner de validación */}
        {(stage === stages.validated || stage === stages.stamped) && (
          <div className="bg-sage-200 rounded-xl px-4 py-[14px] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sage-600 grid place-items-center text-white shrink-0">
              <Check size={20} strokeWidth={2.75} />
            </div>
            <div>
              <div className="font-extrabold text-[14.5px] text-sage-900">
                {stage === stages.stamped ? 'Sello registrado' : 'Token válido'}
              </div>
              <div className="text-[12.5px] text-sage-800 leading-snug">
                {context?.card?.name || 'Tarjeta'}
                {context?.customer && ` · ${context.customer.name || context.customer.device_id?.slice(0, 8) || 'cliente'}`}
              </div>
            </div>
          </div>
        )}

        {/* banner de éxito sello */}
        {stage === stages.stamped && (
          <div className="bg-brand-100 border border-brand-300 rounded-xl px-4 py-4 text-center">
            <div className="font-display text-[44px] text-brand-700 leading-none">{stamps}</div>
            <div className="text-[13.5px] text-brand-800 font-bold mt-1">sellos de {total}</div>
          </div>
        )}

        {/* banner de canje */}
        {stage === stages.redeemed && (
          <div className="bg-sage-100 border border-sage-300 rounded-xl px-5 py-6 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-sage-500 grid place-items-center text-white">
              <Gift size={24} strokeWidth={2.75} />
            </div>
            <div className="font-extrabold text-[16px] text-sage-900">¡Recompensa canjeada!</div>
            <div className="text-[13px] text-sage-800 leading-snug">
              La recompensa fue marcada como utilizada y no podrá reutilizarse.
            </div>
          </div>
        )}

        {/* tarjeta de progreso */}
        {(stage === stages.validated || stage === stages.stamped) && context && (
          <div className="bg-brand-600 rounded-xl p-5 text-brand-100 shadow-md relative overflow-hidden">
            <div className="absolute -top-12 -right-8 w-[160px] h-[160px] rounded-full bg-brand-400 opacity-[.28] pointer-events-none" />
            <div className="relative font-mono text-[10px] uppercase tracking-[.14em] opacity-70 font-extrabold mb-2">
              Progreso actual
            </div>
            <div className="relative font-display text-[42px] leading-none text-white mb-4">
              {stamps} <span className="text-[22px] opacity-60">/ {total}</span>
            </div>
            <div className="relative flex gap-2 flex-wrap">
              {Array.from({ length: total }).map((_, i) => {
                const isStamped = i < stamps;
                const isNext    = i === stamps;
                const isReward  = i === total - 1;
                return (
                  <div key={i}
                    className={`w-9 h-9 rounded-full grid place-items-center font-extrabold text-[13px] transition
                      ${isStamped
                        ? 'bg-bg text-brand-700'
                        : isNext
                          ? 'border-2 border-dashed border-brand-300 text-brand-200'
                          : 'border-2 border-brand-300/30 text-brand-100/50'
                      }`}>
                    {isStamped
                      ? <Check size={16} strokeWidth={2.75} />
                      : isReward
                        ? <Gift size={16} strokeWidth={2.75} />
                        : i + 1}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* filas de info */}
        {stage === stages.validated && context && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-4 py-3 bg-neutral-100 rounded-xl">
              <span className="text-[13.5px] text-neutral-700">Recompensa</span>
              <span className="text-[13.5px] font-bold text-ink">{context.card.reward || '—'}</span>
            </div>
          </div>
        )}

        {/* error */}
        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}

        {/* acciones */}
        <div className="mt-auto pt-2 flex flex-col gap-[10px]">
          {stage === stages.validated && completed && context.card.status !== 'reward_claimed' && (
            <div className="bg-brand-100 border border-brand-300 rounded-xl px-4 py-3 text-center text-[13.5px] font-bold text-brand-800">
              🎉 Recompensa: {context.card.reward}
            </div>
          )}

          {context?.card?.status === 'reward_claimed' ? (
            <div className="bg-neutral-100 text-neutral-600 rounded-xl px-4 py-4 text-center text-[13.5px] font-bold">
              Recompensa ya canjeada
            </div>
          ) : stage === stages.validated ? (
            <>
              <button onClick={addStamp} disabled={busy}
                className="w-full bg-brand hover:bg-brand-600 text-white font-extrabold text-[17px] py-[19px] rounded-full flex items-center justify-center gap-[10px] shadow-md transition disabled:opacity-50">
                {busy
                  ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Stamp size={20} strokeWidth={2.75} />Registrar sello</>}
              </button>
              {completed && (
                <button onClick={redeem} disabled={busy}
                  className="w-full border border-neutral-400 text-neutral-700 font-bold text-[14.5px] py-[14px] rounded-full hover:bg-neutral-100 transition disabled:opacity-50">
                  Canjear recompensa
                </button>
              )}
            </>
          ) : stage === stages.stamped ? (
            <button onClick={reset}
              className="w-full bg-brand hover:bg-brand-600 text-white font-extrabold text-[16px] py-4 rounded-full transition">
              Escanear otro
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
