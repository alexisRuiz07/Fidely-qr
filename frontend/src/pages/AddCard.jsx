import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { ArrowLeft, Camera, Link2, ScanLine, RefreshCw } from 'lucide-react';

const READER_ID = 'fidely-add-reader';

function extractCardId(input) {
  try {
    const url = new URL(input.trim());
    const m = url.pathname.match(/\/welcome\/([0-9a-f-]{36})/i);
    if (m) return m[1];
  } catch {}
  const m = input.match(/\/welcome\/([0-9a-f-]{36})/i);
  if (m) return m[1];
  const uuid = input.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return uuid ? uuid[0] : null;
}

export default function AddCard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tab,     setTab]     = useState(() => searchParams.get('tab') === 'link' ? 'link' : 'scan');
  const [camOn,   setCamOn]   = useState(false);
  const [camErr,  setCamErr]  = useState('');
  const [linkVal, setLinkVal] = useState('');
  const [linkErr, setLinkErr] = useState('');

  const html5Ref  = useRef(null);
  const readerRef = useRef(null);

  /* ── limpiar cámara al desmontar o cambiar pestaña ── */
  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  useEffect(() => {
    stopCamera();
    setCamErr('');
  }, [tab]);

  function stopCamera() {
    setCamOn(false);
    if (html5Ref.current) {
      html5Ref.current.stop().catch(() => {});
      html5Ref.current = null;
    }
  }

  async function startCamera() {
    setCamErr('');
    stopCamera();
    setCamOn(true);

    const scanner = new Html5Qrcode(readerRef.current.id);
    html5Ref.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          stopCamera();
          const id = extractCardId(decoded);
          if (id) {
            navigate(`/welcome/${id}`);
          } else {
            setCamErr('QR no reconocido. Asegúrate de escanear el código del negocio.');
          }
        },
        () => {}
      );
    } catch (e) {
      const msg = typeof e === 'string' ? e : e?.message || '';
      setCamErr(
        msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('permis')
          ? 'Permiso de cámara denegado. Actívalo en la configuración del navegador.'
          : 'No se pudo abrir la cámara. ' + msg
      );
      setCamOn(false);
      html5Ref.current = null;
    }
  }

  function handleLink() {
    setLinkErr('');
    const id = extractCardId(linkVal.trim());
    if (!id) {
      setLinkErr('No se reconoce ese enlace. Pega el link completo del QR del negocio.');
      return;
    }
    navigate(`/welcome/${id}`);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     Pestaña ESCANEAR — pantalla oscura estilo ScanQr
  ───────────────────────────────────────────────────────────────────────── */
  if (tab === 'scan') {
    return (
      <div className="min-h-dvh font-sans flex flex-col" style={{ background: '#1b1a17' }}>

        {/* cabecera oscura */}
        <div className="flex-none px-5 flex items-center justify-between text-white"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)', paddingBottom: 14 }}>

          <div className="flex items-center gap-[10px]">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full grid place-items-center transition"
              style={{ background: 'rgba(255,255,255,.12)' }}>
              <ArrowLeft size={18} strokeWidth={2.75} />
            </button>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[.14em] opacity-55">
                Fidely QR
              </div>
              <div className="font-extrabold text-[16px] leading-tight">Añadir tarjeta</div>
            </div>
          </div>

          {/* cambiar a "Pegar link" */}
          <button
            onClick={() => setTab('link')}
            className="flex items-center gap-[7px] px-[14px] py-[9px] rounded-full font-semibold text-[13px] transition"
            style={{ background: 'rgba(255,255,255,.10)', color: 'rgba(255,255,255,.7)' }}>
            <Link2 size={14} strokeWidth={2.75} />
            Pegar link
          </button>
        </div>

        {/* viewport de cámara — llena el espacio restante */}
        <div className="flex-1 mx-4 rounded-xl overflow-hidden relative"
          style={{
            background: 'repeating-linear-gradient(135deg,#2c2a25 0 14px,#252420 14px 28px)',
            minHeight: 260,
          }}>

          {/* video real (html5-qrcode renderiza aquí) */}
          <div
            id={READER_ID}
            ref={readerRef}
            className={`absolute inset-0 transition-opacity duration-300 ${camOn ? 'opacity-100' : 'opacity-0'}
              [&>video]:w-full [&>video]:h-full [&>video]:object-cover
              [&_img]:hidden [&_button]:hidden [&_select]:hidden [&_div:last-child]:hidden`}
          />

          {/* marco de esquinas naranja */}
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="relative w-[210px] h-[210px]">
              {/* esquina sup-izq */}
              <div className="absolute top-0 left-0 w-[48px] h-[48px] rounded-tl-[18px]"
                style={{ borderTop: '4px solid #c67139', borderLeft: '4px solid #c67139' }} />
              {/* esquina sup-der */}
              <div className="absolute top-0 right-0 w-[48px] h-[48px] rounded-tr-[18px]"
                style={{ borderTop: '4px solid #c67139', borderRight: '4px solid #c67139' }} />
              {/* esquina inf-izq */}
              <div className="absolute bottom-0 left-0 w-[48px] h-[48px] rounded-bl-[18px]"
                style={{ borderBottom: '4px solid #c67139', borderLeft: '4px solid #c67139' }} />
              {/* esquina inf-der */}
              <div className="absolute bottom-0 right-0 w-[48px] h-[48px] rounded-br-[18px]"
                style={{ borderBottom: '4px solid #c67139', borderRight: '4px solid #c67139' }} />

              {/* línea de escaneo */}
              <div className="absolute left-[12px] right-[12px] top-1/2 h-[3px] rounded-full animate-pulse"
                style={{ background: '#c67139', boxShadow: '0 0 16px #c67139' }} />
            </div>
          </div>

          {/* mensaje de error de cámara */}
          {camErr && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center"
              style={{ background: 'rgba(27,26,23,.90)' }}>
              <p className="text-red-400 text-[14px] leading-[1.5]">{camErr}</p>
              <button
                onClick={() => { setCamErr(''); startCamera(); }}
                className="flex items-center gap-2 px-5 py-[10px] rounded-full font-semibold text-[13px] text-white transition"
                style={{ background: 'rgba(255,255,255,.14)' }}>
                <RefreshCw size={14} strokeWidth={2.75} />
                Reintentar
              </button>
            </div>
          )}

          {/* texto inferior dentro del viewport */}
          <div className="absolute bottom-4 left-4 right-4 text-center text-[13px]"
            style={{ color: 'rgba(255,255,255,.65)' }}>
            Apunta al QR del negocio
          </div>
        </div>

        {/* controles inferiores */}
        <div className="flex-none px-4 pt-4 flex flex-col gap-[10px]"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>

          <button
            onClick={camOn ? stopCamera : startCamera}
            className="w-full bg-brand hover:bg-brand-600 text-white font-extrabold text-[16px] py-[17px] rounded-full flex items-center justify-center gap-[10px] transition shadow-md active:scale-[.98]">
            <Camera size={19} strokeWidth={2.75} />
            {camOn ? 'Detener' : 'Escanear'}
          </button>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────────────
     Pestaña PEGAR LINK — pantalla clara normal
  ───────────────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-dvh bg-bg font-sans flex flex-col">

      {/* cabecera */}
      <header className="px-5 pb-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand grid place-items-center">
              <ScanLine size={15} strokeWidth={2.75} className="text-white" />
            </div>
            <span className="font-display text-[19px] text-ink">Fidely</span>
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-neutral-200 grid place-items-center text-neutral-700 hover:bg-neutral-300 transition">
            <ArrowLeft size={18} strokeWidth={2.75} />
          </button>
        </div>
      </header>

      <div className="px-5 pb-4">
        <div className="max-w-md mx-auto">
          <h1 className="font-display font-normal text-[32px] leading-tight text-ink">
            Añadir tarjeta
          </h1>
          <p className="text-neutral-600 text-[14px] mt-1">
            Pega el link del QR del negocio
          </p>
        </div>
      </div>

      {/* cambiar a escanear */}
      <div className="px-5 pb-5">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setTab('scan')}
            className="flex items-center gap-2 px-4 py-[10px] rounded-full bg-neutral-200 text-neutral-700 font-semibold text-[13.5px] transition hover:bg-neutral-300">
            <Camera size={15} strokeWidth={2.75} />
            Usar la cámara
          </button>
        </div>
      </div>

      <main className="flex-1 px-5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)' }}>
        <div className="max-w-md mx-auto flex flex-col gap-4">

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-[15px] text-ink">Enlace del negocio</label>
            <textarea
              value={linkVal}
              onChange={e => { setLinkVal(e.target.value); setLinkErr(''); }}
              placeholder="https://fidely.app/welcome/…"
              rows={3}
              className="w-full bg-neutral-200 rounded-2xl px-4 py-4 text-[14.5px] text-ink placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-brand/40 resize-none font-mono transition"
            />
            {linkErr && <p className="text-red-600 text-[13px]">{linkErr}</p>}
          </div>

          <button
            onClick={handleLink}
            disabled={!linkVal.trim()}
            className="w-full bg-brand hover:bg-brand-600 text-white font-extrabold text-[16px] py-[16px] rounded-full disabled:opacity-40 transition active:scale-[.98]">
            Añadir tarjeta
          </button>

          {/* guía */}
          <div className="bg-neutral-200 rounded-2xl p-4 flex flex-col gap-2">
            <div className="font-bold text-[13.5px] text-ink">¿Dónde encuentro el link?</div>
            {[
              'Pide al negocio que te muestre su código QR.',
              'Abre la cámara de tu móvil y apúntala al QR.',
              'El link aparecerá; cópialo y pégalo aquí.',
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-brand grid place-items-center text-white font-extrabold text-[11px] shrink-0 mt-[1px]">
                  {i + 1}
                </div>
                <span className="text-[13.5px] text-neutral-700 leading-[1.5]">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
