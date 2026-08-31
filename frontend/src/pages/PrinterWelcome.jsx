import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Wallet, Gift, Check, ArrowLeft, ScanLine } from 'lucide-react';
import { api } from '../services/api.js';
import { getDeviceId } from '../utils/device.js';
import { useLang } from '../i18n/index.jsx';

export default function PrinterWelcome() {
  const { cardId } = useParams();
  const navigate   = useNavigate();
  const { lang, setLang, t } = useLang();

  const [card,    setCard]    = useState(null);
  // loading | ready | collecting | adding | done | error
  const [status,  setStatus]  = useState('loading');
  const [already, setAlready] = useState(false);
  const [err,     setErr]     = useState('');

  const [collectName,  setCollectName]  = useState('');
  const [collectEmail, setCollectEmail] = useState('');
  const [emailErr,     setEmailErr]     = useState('');

  useEffect(() => { fetchCard(); }, [cardId]);

  async function fetchCard() {
    try {
      const data = await api.get('/api/public/card/' + cardId);
      setCard(data.card || data.loyalty_card || data);
    } catch {
      // endpoint no público — avanzamos sin info previa
    }
    setStatus('ready');
  }

  function startCollecting() {
    setEmailErr('');
    setStatus('collecting');
  }

  async function addToWallet(skipData = false) {
    if (!skipData && collectEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(collectEmail)) {
      setEmailErr('Ingresa un correo válido o déjalo vacío.');
      return;
    }
    setEmailErr('');
    setStatus('adding');
    try {
      const payload = {
        loyalty_card_id: cardId,
        device_id: getDeviceId(),
        ...((!skipData && collectName.trim())  ? { name:  collectName.trim()  } : {}),
        ...((!skipData && collectEmail.trim()) ? { email: collectEmail.trim() } : {}),
      };
      const data = await api.welcome(payload);
      if (!card) setCard(data.loyalty_card || null);
      if (data.already_owned) setAlready(true);
      setStatus('done');
      setTimeout(() => navigate('/wallet'), data.already_owned ? 1800 : 2200);
    } catch (e) {
      setErr(e.message);
      setStatus('error');
    }
  }

  const primary   = card?.primary_color   || '#c67139';
  const secondary = card?.secondary_color || '#f5ead8';
  const bizName   = card?.business?.name  || card?.name || 'Negocio';
  const cardName  = card?.name || t('cardLoyalty');
  const reward    = card?.reward          || t('rewardDefault');
  const total     = card?.total_stamps    ?? 6;
  const initial   = bizName.charAt(0).toUpperCase();

  // ── LOADING ─────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── ERROR ────────────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="text-[15px] text-red-700 bg-red-50 border border-red-200 px-5 py-4 rounded-xl">
          {err}
        </div>
        <button onClick={() => navigate('/')}
          className="text-brand-700 font-semibold underline text-[14px]">
          {t('backHome')}
        </button>
      </div>
    );
  }

  // ── COLLECTING (formulario nombre / correo) ──────────────────────────────
  if (status === 'collecting') {
    return (
      <div className="min-h-dvh bg-bg font-sans flex flex-col"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 24px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)' }}>

        <div className="px-6 flex items-center gap-3 mb-6">
          <button onClick={() => setStatus('ready')}
            className="w-10 h-10 rounded-full bg-neutral-200 grid place-items-center text-neutral-700 hover:bg-neutral-300 transition shrink-0">
            <ArrowLeft size={18} strokeWidth={2.75} />
          </button>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[.14em] text-brand-700">Paso 2 de 2</p>
            <h2 className="font-display text-[26px] leading-tight text-ink">Cuéntanos quién eres</h2>
          </div>
        </div>

        <div className="flex-1 px-6 flex flex-col gap-4">
          <p className="text-[14px] text-neutral-600 leading-[1.5]">
            Opcional, pero si lo rellenas el negocio podrá contactarte y tú recibirás avisos de tus recompensas.
          </p>

          {/* nombre */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[13px] font-bold text-ink">Nombre</label>
            <input
              type="text"
              value={collectName}
              onChange={e => setCollectName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full bg-neutral-200 rounded-full py-[13px] px-[18px] text-[15px] text-ink placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-brand/40 transition"
            />
          </div>

          {/* correo */}
          <div className="flex flex-col gap-[6px]">
            <label className="text-[13px] font-bold text-ink">Correo electrónico</label>
            <input
              type="email"
              value={collectEmail}
              onChange={e => { setCollectEmail(e.target.value); setEmailErr(''); }}
              placeholder="tu@correo.com"
              className="w-full bg-neutral-200 rounded-full py-[13px] px-[18px] text-[15px] text-ink placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-brand/40 transition"
            />
            {emailErr && <p className="text-red-600 text-[13px] px-1">{emailErr}</p>}
          </div>

          <div className="mt-auto flex flex-col gap-3 pt-4">
            <button
              onClick={() => addToWallet(false)}
              className="w-full bg-brand hover:bg-brand-600 text-white font-extrabold text-[17px] py-[18px] rounded-full shadow-md flex items-center justify-center gap-[10px] transition">
              <Wallet size={19} strokeWidth={2.75} />
              Guardar y añadir
            </button>
            <button
              onClick={() => addToWallet(true)}
              className="text-center text-[14px] text-neutral-500 hover:text-neutral-700 transition py-1">
              Continuar sin datos
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── DONE ─────────────────────────────────────────────────────────────────
  if (status === 'done') {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center gap-5 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-sage-200 grid place-items-center">
          <Check size={36} strokeWidth={2.75} className="text-sage-700" />
        </div>
        <div>
          <h2 className="font-display text-[28px] text-ink leading-tight">
            {already ? t('doneAlready') : t('doneAdded')}
          </h2>
          <p className="text-neutral-600 text-[14px] mt-2">
            {already ? t('doneInWallet') : t('doneGoWallet')}
          </p>
        </div>
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── READY (pantalla de bienvenida) ───────────────────────────────────────
  return (
    <div className="min-h-dvh bg-bg font-sans flex flex-col relative overflow-hidden">

      {/* círculo decorativo top-right */}
      <div className="absolute -top-[90px] -right-[70px] w-[280px] h-[280px] rounded-full bg-brand-200 opacity-90 pointer-events-none" />

      <div className="relative flex-1 flex flex-col px-6 pt-safe"
        style={{
          paddingTop:    'calc(env(safe-area-inset-top, 0px) + 28px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 28px)',
          gap: 22,
        }}>

        {/* fila superior: logo Fidely + flecha atrás */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand grid place-items-center">
              <ScanLine size={15} strokeWidth={2.75} className="text-white" />
            </div>
            <span className="font-display text-[19px] text-ink">Fidely</span>
          </Link>
          <Link to="/"
            className="w-10 h-10 rounded-full bg-neutral-200 grid place-items-center text-neutral-700 hover:bg-neutral-300 transition">
            <ArrowLeft size={18} strokeWidth={2.75} />
          </Link>
        </div>

        {/* logo negocio + language switcher */}
        <div className="flex items-center justify-between">
          <div className="w-[60px] h-[60px] rounded-[22px] shadow-md grid place-items-center font-display text-[26px]"
            style={{ background: primary, color: '#fff' }}>
            {card?.logo_url
              ? <img src={card.logo_url} className="w-full h-full rounded-[22px] object-cover" alt={bizName} />
              : initial}
          </div>
          <div className="flex gap-1 bg-neutral-200 p-1 rounded-full">
            {['es', 'en'].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`text-[12px] font-extrabold px-3 py-[5px] rounded-full transition ${
                  lang === l ? 'bg-bg shadow-sm' : 'text-neutral-600'
                }`}
              >
                {l === 'es' ? 'ES' : 'EN'}
              </button>
            ))}
          </div>
        </div>

        {/* texto de bienvenida */}
        <div className="flex flex-col gap-[10px]">
          <div className="font-mono text-[11px] uppercase tracking-[.14em] text-brand-700">
            {t('invites', { biz: bizName })}
          </div>
          <h1 className="font-display font-normal text-[34px] sm:text-[36px] leading-[1.05] text-ink m-0">
            {card ? t('rewardFree', { n: total, reward: reward.toLowerCase() }) : t('earnStamps')}
          </h1>
          <p className="text-[14.5px] sm:text-[15px] text-neutral-700 leading-[1.5] m-0">
            {t('welcomeHelp1')} {t('welcomeHelp2')}
          </p>
        </div>

        {/* preview de la tarjeta */}
        <div className="rounded-xl p-5 relative overflow-hidden shadow-md"
          style={{ background: primary, color: '#fff' }}>
          {/* círculo decorativo */}
          <div className="absolute -top-[46px] -right-[34px] w-[150px] h-[150px] rounded-full opacity-[.28] pointer-events-none"
            style={{ background: secondary }} />

          {/* cabecera tarjeta */}
          <div className="relative flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-[16px] grid place-items-center font-display text-[20px] shrink-0"
              style={{ background: secondary, color: primary }}>
              {card?.logo_url
                ? <img src={card.logo_url} className="w-full h-full rounded-[16px] object-cover" alt={bizName} />
                : initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-[17px]">{bizName}</div>
              <div className="text-[13px] opacity-75">{cardName}</div>
            </div>
          </div>

          {/* label recompensa */}
          <div className="relative text-[11px] uppercase tracking-[.12em] opacity-70 font-bold mb-[10px]">
            {t('rewardLabel', { reward })}
          </div>

          {/* dots sellos */}
          <div className="relative flex gap-2 flex-wrap">
            {Array.from({ length: Math.min(total, 8) }).map((_, i) => {
              const isLast = i === total - 1 || i === Math.min(total, 8) - 1;
              return (
                <div key={i}
                  className="w-[30px] h-[30px] rounded-full grid place-items-center text-[12px] font-bold"
                  style={{
                    border: '2px solid rgba(245,234,216,.35)',
                    color: isLast ? undefined : 'rgba(245,234,216,.55)',
                    background: isLast ? 'rgba(200,230,180,.35)' : undefined,
                  }}>
                  {isLast ? <Gift size={15} strokeWidth={2.75} style={{ color: 'rgba(245,234,216,.9)' }} /> : i + 1}
                </div>
              );
            })}
          </div>
        </div>

        {/* botón + nota */}
        <div className="mt-auto flex flex-col gap-3">
          <button
            onClick={startCollecting}
            className="w-full bg-brand hover:bg-brand-600 text-white font-extrabold text-[17px] py-[18px] rounded-full shadow-md flex items-center justify-center gap-[10px] transition">
            <Wallet size={19} strokeWidth={2.75} />{t('addToWallet')}
          </button>
          <p className="text-center text-[13px] text-neutral-600 m-0">
            {t('saveNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
