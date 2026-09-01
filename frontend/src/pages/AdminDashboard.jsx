import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode, LayoutDashboard, CreditCard, Users, IdCard, Store,
  Stamp, Gift, TrendingUp, Plus, Pencil, Trash2,
  LogOut, X, Download, Menu, UserPlus, ShieldCheck, Power, Share2,
  Mail, Search, Phone, CheckCircle2, AlertCircle, Eye, EyeOff,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import LogoUploader from '../components/LogoUploader.jsx';
import { api } from '../services/api.js';

// ── estilos compartidos ──────────────────────────────────────────────────────

const INP  = 'w-full bg-neutral-100 border border-neutral-300 rounded-full py-[11px] px-[18px] text-sm text-ink placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition';
const INP2 = 'w-full bg-neutral-100 border border-neutral-300 rounded-md py-[11px] px-[18px] text-sm text-ink placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition resize-none';

const STAMP_OPTIONS = [4, 5, 6, 8, 10, 12];

const NAV = [
  { key: 'dashboard', label: 'Resumen',   Icon: LayoutDashboard },
  { key: 'cards',     label: 'Tarjetas',  Icon: CreditCard },
  { key: 'clients',   label: 'Clientes',  Icon: Users },
  { key: 'employees', label: 'Empleados', Icon: IdCard },
  { key: 'business',  label: 'Negocio',   Icon: Store },
  { key: 'social',    label: 'Redes',     Icon: Share2 },
];

// ── Field ────────────────────────────────────────────────────────────────────

function Field({ label, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-[13px] font-bold text-ink block mb-[7px]">{label}</span>
      {children}
    </label>
  );
}

// ── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-[11px] px-[14px] py-[12px] rounded-full text-[14.5px] font-semibold transition-all text-left ${
        active ? 'bg-brand text-white font-bold' : 'text-neutral-400 hover:text-white hover:bg-white/10'
      }`}
    >
      <Icon size={18} strokeWidth={2.75} />
      {label}
    </button>
  );
}

// ── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, Icon, accent }) {
  return (
    <div className={`rounded-lg p-4 md:p-5 flex flex-col gap-2 shadow-sm ${accent ? 'bg-brand-200' : 'bg-neutral-100'}`}>
      <div className="flex items-center justify-between">
        <span className={`text-[12px] md:text-[13px] font-bold ${accent ? 'text-brand-800' : 'text-neutral-600'}`}>{label}</span>
        <Icon size={17} strokeWidth={2.75} className={accent ? 'text-brand-700' : 'text-brand-600'} />
      </div>
      <div className={`font-display text-[28px] md:text-[34px] leading-none ${accent ? 'text-brand-900' : 'text-ink'}`}>{value ?? '—'}</div>
    </div>
  );
}

// ── WelcomeQrModal ───────────────────────────────────────────────────────────

function WelcomeQrModal({ card, onClose }) {
  const url = `${window.location.origin}/welcome/${card.id}`;
  return (
    <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4">
      <div className="bg-bg rounded-lg shadow-lg w-full max-w-xs p-6 text-center space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-display text-[22px] text-ink">QR de bienvenida</p>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-neutral-200 grid place-items-center hover:bg-neutral-300 transition">
            <X size={16} strokeWidth={2.75} className="text-neutral-700" />
          </button>
        </div>
        <p className="text-sm text-neutral-600">
          El cliente escanea este QR para agregar <strong>{card.name}</strong> a su wallet.
        </p>
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-md shadow-sm">
            <QRCodeSVG value={url} size={180} fgColor="#201e1d" />
          </div>
        </div>
        <p className="text-xs text-neutral-500 break-all">{url}</p>
        <button onClick={() => navigator.clipboard?.writeText(url)}
          className="w-full bg-neutral-200 text-neutral-700 rounded-full py-2.5 text-sm font-semibold hover:bg-neutral-300 transition">
          Copiar enlace
        </button>
        <button onClick={onClose}
          className="w-full bg-brand-600 text-white rounded-full py-2.5 text-sm font-bold hover:bg-brand-700 transition">
          Cerrar
        </button>
      </div>
    </div>
  );
}

// ── EditCardModal ─────────────────────────────────────────────────────────────

function EditCardModal({ card, onSave, onClose }) {
  const [form, setForm] = useState({
    name: card.name, description: card.description || '', logo_url: card.logo_url || '',
    total_stamps: card.total_stamps, reward: card.reward,
    primary_color: card.primary_color || '#c67139', secondary_color: card.secondary_color || '#f5ead8',
  });
  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  async function submit(e) {
    e.preventDefault();
    setSaving(true); setErrMsg('');
    try {
      const r = await api.updateCard(card.id, { ...form, total_stamps: Number(form.total_stamps) });
      onSave(r.card);
    } catch (e2) { setErrMsg(e2.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4">
      <div className="bg-bg rounded-lg shadow-lg w-full max-w-sm p-6 space-y-4 overflow-y-auto max-h-[92vh]">
        <div className="flex items-center justify-between">
          <p className="font-display text-[22px] text-ink">Editar tarjeta</p>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-neutral-200 grid place-items-center hover:bg-neutral-300 transition">
            <X size={16} strokeWidth={2.75} className="text-neutral-700" />
          </button>
        </div>
        {errMsg && <p className="text-red-600 text-sm bg-red-50 rounded-md px-3 py-2">{errMsg}</p>}
        <form onSubmit={submit} className="space-y-4">
          <Field label="Nombre"><input className={INP} required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Recompensa"><input className={INP} required value={form.reward} onChange={e => setForm({ ...form, reward: e.target.value })} /></Field>
          <Field label="Descripción"><input className={INP} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Sellos necesarios">
            <div className="flex gap-2">
              {STAMP_OPTIONS.map(n => (
                <button key={n} type="button" onClick={() => setForm({ ...form, total_stamps: n })}
                  className={`flex-1 text-center text-sm font-bold py-2.5 rounded-full transition ${
                    Number(form.total_stamps) === n ? 'bg-brand-600 text-white' : 'border border-neutral-300 text-neutral-700 hover:border-brand'
                  }`}>{n}</button>
              ))}
            </div>
          </Field>
          <Field label="Logo"><LogoUploader initial={form.logo_url} onUploaded={url => setForm({ ...form, logo_url: url })} /></Field>
          <div className="flex gap-3">
            <Field label="Color principal" className="flex-1">
              <input type="color" className="w-full h-10 mt-[7px] rounded-md cursor-pointer" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} />
            </Field>
            <Field label="Color secundario" className="flex-1">
              <input type="color" className="w-full h-10 mt-[7px] rounded-md cursor-pointer" value={form.secondary_color} onChange={e => setForm({ ...form, secondary_color: e.target.value })} />
            </Field>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-neutral-300 rounded-full py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 bg-brand-600 text-white font-bold rounded-full py-2.5 text-sm disabled:opacity-45 hover:bg-brand-700 transition">
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── componente principal ─────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab]         = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  const [business,  setBusiness]  = useState(null);
  const [cards,     setCards]     = useState([]);
  const [employees, setEmployees] = useState([]);
  const [clients,   setClients]   = useState([]);
  const [stats,     setStats]     = useState(null);
  const [history,   setHistory]   = useState([]);

  const [toast,        setToast]        = useState(null);  // { msg, type, id }
  const toastKey = toast?.id ?? 0;
  const [editingCard,  setEditingCard]  = useState(null);
  const [qrCard,       setQrCard]       = useState(null);
  const [showCardForm, setShowCardForm] = useState(false);

  const [bizForm, setBizForm] = useState({
    name: '', description: '', logo_url: '', primary_color: '#c67139', secondary_color: '#f5ead8',
  });
  const [socialForm, setSocialForm] = useState({
    facebook_url: '', instagram_url: '', contact_email: '', footer_text: '© 2025 Todos los derechos reservados',
  });
  const [cardForm, setCardForm] = useState({
    name: '', description: '', logo_url: '', total_stamps: 6, reward: '',
    primary_color: '#c67139', secondary_color: '#f5ead8',
  });
  const [empForm, setEmpForm] = useState({ email: '', full_name: '', password: '' });
  const [showEmpModal,  setShowEmpModal]  = useState(false);
  const [empCanRedeem,  setEmpCanRedeem]  = useState(true);
  const [empBranch,     setEmpBranch]     = useState('Centro');
  const [showEmpPw,     setShowEmpPw]     = useState(false);

  // clientes
  const [clientSearch,   setClientSearch]   = useState('');
  const [editingClient,  setEditingClient]  = useState(null); // { id, name, email }
  const [clientForm,     setClientForm]     = useState({ name: '', email: '' });
  const [savingClient,   setSavingClient]   = useState(false);

  function notify(msg, type = 'success') {
    const id = Date.now();
    setToast({ msg, type, id });
    setTimeout(() => setToast(t => t?.id === id ? null : t), 3500);
  }

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [bs, cd, em] = await Promise.all([
        api.get('/api/businesses/me'), api.get('/api/cards'), api.get('/api/employees'),
      ]);
      setBusiness(bs.business || null);
      setCards(cd.cards || []);
      setEmployees(em.employees || []);
      if (bs.business) {
        const biz = bs.business;
        setBizForm({ name: biz.name, description: biz.description || '', logo_url: biz.logo_url || '', primary_color: biz.primary_color || '#c67139', secondary_color: biz.secondary_color || '#f5ead8' });
        setSocialForm({ facebook_url: biz.facebook_url || '', instagram_url: biz.instagram_url || '', contact_email: biz.contact_email || '', footer_text: biz.footer_text || '© 2025 Todos los derechos reservados' });
      }
    } catch (e) {
      if (e.status === 401) { localStorage.removeItem('token'); navigate('/admin/login'); }
      else notify('No se pudo cargar: ' + e.message, 'error');
    }
  }

  async function loadExtended() {
    try {
      const [cl, st, hi] = await Promise.all([api.getClients(), api.getStats(), api.getStampsHistory()]);
      setClients(cl.clients || []);
      setStats(st);
      setHistory(hi.history || []);
    } catch (e) { notify('Error cargando datos: ' + e.message, 'error'); }
  }

  async function saveClient(e) {
    e.preventDefault();
    setSavingClient(true);
    try {
      const r = await api.updateClient(editingClient.id, clientForm);
      setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...r.customer } : c));
      setEditingClient(null);
      notify('Cliente actualizado');
    } catch (err) {
      notify('Error: ' + err.message, 'error');
    } finally {
      setSavingClient(false);
    }
  }

  function handleNav(key) {
    setTab(key);
    setMenuOpen(false);
    if (['dashboard', 'clients'].includes(key) && !stats) loadExtended();
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    navigate('/');
  }

  async function saveBusiness(e) {
    e.preventDefault();
    try {
      const r = business
        ? await api.patch(`/api/businesses/${business.id}`, bizForm)
        : await api.post('/api/businesses', bizForm);
      setBusiness(r.business);
      notify(business ? 'Negocio actualizado correctamente' : '¡Negocio creado con éxito!');
    } catch (e2) { notify(e2.message, 'error'); }
  }

  async function saveSocial(e) {
    e.preventDefault();
    if (!business) return notify('Primero crea tu negocio', 'error');
    try {
      const r = await api.patch(`/api/businesses/${business.id}`, socialForm);
      setBusiness(r.business);
      notify('Redes sociales actualizadas');
    } catch (e2) { notify(e2.message, 'error'); }
  }

  async function createCard(e) {
    e.preventDefault();
    try {
      const r = await api.post('/api/cards', { ...cardForm, total_stamps: Number(cardForm.total_stamps) });
      setCards(c => [r.card, ...c]);
      setCardForm({ name: '', description: '', logo_url: '', total_stamps: 6, reward: '', primary_color: '#c67139', secondary_color: '#f5ead8' });
      setShowCardForm(false);
      notify('Tarjeta creada');
    } catch (e2) { notify(e2.message, 'error'); }
  }

  function onCardSaved(updated) {
    setCards(c => c.map(x => x.id === updated.id ? updated : x));
    setEditingCard(null);
    notify('Tarjeta actualizada');
  }

  async function deleteCard(id) {
    if (!confirm('¿Eliminar esta tarjeta? Los clientes perderán sus sellos.')) return;
    try {
      await api.deleteCard(id);
      setCards(c => c.filter(x => x.id !== id));
      notify('Tarjeta eliminada');
    } catch (e2) { notify(e2.message, 'error'); }
  }

  async function createEmployee(e) {
    e.preventDefault();
    if (empForm.password.length < 6) {
      notify('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    try {
      const r = await api.post('/api/employees', {
        email: empForm.email,
        full_name: empForm.full_name,
        password: empForm.password,
      });
      setEmployees(em => [r.employee, ...em]);
      setEmpForm({ email: '', full_name: '', password: '' });
      setEmpBranch('Centro');
      setEmpCanRedeem(true);
      setShowEmpModal(false);
      setShowEmpPw(false);
      notify('Empleado creado correctamente');
    } catch (e2) { notify(e2.message, 'error'); }
  }

  async function toggleEmployee(emp) {
    try {
      const r = await api.toggleEmployee(emp.id, !emp.is_active);
      setEmployees(em => em.map(x => x.id === emp.id ? r.employee : x));
      notify(r.employee.is_active ? 'Empleado activado' : 'Empleado desactivado');
    } catch (e2) { notify(e2.message, 'error'); }
  }

  async function deleteEmployee(id) {
    if (!confirm('¿Eliminar este empleado?')) return;
    try {
      await api.deleteEmployee(id);
      setEmployees(em => em.filter(x => x.id !== id));
      notify('Empleado eliminado');
    } catch (e2) { notify(e2.message, 'error'); }
  }

  const currentNav = NAV.find(n => n.key === tab);
  const initials   = business?.name ? business.name.slice(0, 2).toUpperCase() : 'AD';

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-bg font-sans">

      {/* overlay móvil */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setMenuOpen(false)} />
      )}

      {/* ─────────────── SIDEBAR ─────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-[246px] bg-neutral-900
        flex flex-col px-[18px] py-[26px] gap-6
        transition-transform duration-300
        md:relative md:translate-x-0 md:inset-auto md:z-auto md:shrink-0
        ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* cerrar en móvil */}
        <button onClick={() => setMenuOpen(false)}
          className="md:hidden absolute top-4 right-3 w-8 h-8 rounded-full bg-white/10 grid place-items-center text-white hover:bg-white/20">
          <X size={16} strokeWidth={2.75} />
        </button>

        {/* brand */}
        <div className="flex items-center gap-[11px] px-2">
          <div className="w-[38px] h-[38px] rounded-[14px] bg-brand grid place-items-center text-white shrink-0">
            <QrCode size={20} strokeWidth={2.75} />
          </div>
          <div className="min-w-0">
            <div className="font-display text-[19px] text-white leading-none">Fidely</div>
            <div className="text-[11px] text-neutral-500 truncate">{business?.name || 'Sin negocio'}</div>
          </div>
        </div>

        {/* nav */}
        <nav className="flex flex-col gap-1">
          {NAV.map(({ key, label, Icon }) => (
            <NavItem key={key} icon={Icon} label={label} active={tab === key} onClick={() => handleNav(key)} />
          ))}
        </nav>

        {/* material impreso */}
        <div className="mt-auto rounded-md p-[15px] flex flex-col gap-[9px]" style={{ background: 'rgba(255,255,255,.07)' }}>
          <div className="text-[13px] font-bold text-white">Material impreso</div>
          <div className="text-[12.5px] leading-snug text-neutral-400">Descarga el QR de bienvenida para tu mostrador.</div>
          {cards.length > 0 ? (
            <button onClick={() => { setQrCard(cards[0]); setMenuOpen(false); }}
              className="bg-sage-500 hover:bg-sage-600 text-white text-[13px] font-bold py-[10px] rounded-full transition flex items-center justify-center gap-1.5">
              <Download size={14} strokeWidth={2.75} />
              Ver QR
            </button>
          ) : (
            <p className="text-xs text-neutral-500">Crea una tarjeta primero.</p>
          )}
        </div>
      </aside>

      {/* ─────────────── MAIN ─────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* top bar */}
        <div className="flex-none px-4 md:px-8 py-4 md:py-[22px] border-b border-neutral-300 flex items-center gap-3 bg-bg">
          {/* hamburger móvil */}
          <button onClick={() => setMenuOpen(true)}
            className="md:hidden w-10 h-10 rounded-full bg-neutral-200 grid place-items-center text-neutral-700 hover:bg-neutral-300 shrink-0">
            <Menu size={20} strokeWidth={2.75} />
          </button>

          <div className="flex-1 min-w-0">
            <h3 className="font-display text-[22px] md:text-[30px] text-ink leading-tight m-0 truncate">{currentNav?.label}</h3>
            <div className="text-[12px] md:text-[13.5px] text-neutral-600 mt-[2px] hidden sm:block">
              {tab === 'dashboard'  && `${cards.length} tarjetas · ${employees.length} empleados`}
              {tab === 'cards'      && `${cards.length} tarjeta${cards.length !== 1 ? 's' : ''} de fidelización`}
              {tab === 'clients'    && `${clients.length} cliente${clients.length !== 1 ? 's' : ''} registrados`}
              {tab === 'employees'  && `${employees.length} empleado${employees.length !== 1 ? 's' : ''}`}
              {tab === 'business'   && (business ? `✓ ${business.name}` : 'Sin negocio configurado')}
              {tab === 'social'     && 'Redes sociales y pie de página'}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {tab === 'cards' && (
              <button onClick={() => setShowCardForm(true)}
                className="flex items-center gap-2 bg-brand hover:bg-brand-600 text-white text-sm md:text-[14.5px] font-bold px-4 md:px-[22px] py-2.5 md:py-[13px] rounded-full shadow-sm transition">
                <Plus size={16} strokeWidth={2.75} />
                <span className="hidden sm:inline">Nueva tarjeta</span>
              </button>
            )}
            {tab === 'employees' && (
              <button onClick={() => setShowEmpModal(true)}
                className="flex items-center gap-2 bg-brand hover:bg-brand-600 text-white text-sm md:text-[14.5px] font-bold px-4 md:px-[22px] py-2.5 md:py-[13px] rounded-full shadow-sm transition">
                <UserPlus size={16} strokeWidth={2.75} />
                <span className="hidden sm:inline">Nuevo empleado</span>
              </button>
            )}
            <button onClick={logout} title="Cerrar sesión"
              className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-neutral-200 grid place-items-center text-neutral-600 hover:bg-neutral-300 transition">
              <LogOut size={16} strokeWidth={2.75} />
            </button>
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-brand-600 grid place-items-center text-white font-bold text-sm select-none">
              {initials}
            </div>
          </div>
        </div>

        {/* scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">

          {/* ── RESUMEN ── */}
          {tab === 'dashboard' && (
            <div className="flex flex-col gap-4 md:gap-5">

              {/* banner primeros pasos — solo si no hay tarjetas */}
              {cards.length === 0 && (
                <div className="bg-brand-100 border border-brand-300 rounded-lg p-5 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-brand grid place-items-center shrink-0">
                    <QrCode size={20} strokeWidth={2.75} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[15px] text-brand-900">Crea tu primera tarjeta para generar el QR</p>
                    <p className="text-[13px] text-brand-800 mt-1 leading-snug">
                      Cada tarjeta de fidelización tiene su propio QR de bienvenida que los clientes escanean para unirse.
                    </p>
                  </div>
                  <button
                    onClick={() => handleNav('cards')}
                    className="shrink-0 bg-brand hover:bg-brand-600 text-white font-bold text-[13px] px-4 py-[9px] rounded-full transition">
                    Crear tarjeta
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
                <StatCard label="Sellos registrados"    value={stats?.total_stamps ?? '—'} Icon={Stamp}       />
                <StatCard label="Tarjetas activas"      value={stats?.total_cards  ?? cards.length} Icon={CreditCard}  />
                <StatCard label="Recompensas canjeadas" value={stats?.total_claims ?? '—'} Icon={Gift}        />
                <StatCard label="Empleados activos"     value={employees.filter(e => e.is_active).length} Icon={TrendingUp} accent />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 md:gap-5">
                <div className="bg-neutral-100 rounded-lg p-5 flex flex-col gap-[14px] shadow-sm">
                  <div className="font-bold text-[16px] text-ink">Tarjetas creadas</div>
                  {cards.length === 0 ? (
                    <p className="text-sm text-neutral-500">Sin tarjetas aún.</p>
                  ) : (
                    <div className="flex flex-col">
                      {cards.slice(0, 5).map(c => (
                        <div key={c.id} className="flex items-center gap-3 py-[11px] border-b border-neutral-300 last:border-0">
                          <div className="w-[34px] h-[34px] rounded-full grid place-items-center shrink-0"
                            style={{ background: `${c.primary_color}33`, color: c.primary_color }}>
                            <CreditCard size={16} strokeWidth={2.75} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-bold text-ink truncate">{c.name}</div>
                            <div className="text-[12px] text-neutral-600">{c.total_stamps} sellos · {c.reward}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-neutral-100 rounded-lg p-5 flex flex-col gap-[14px] shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-[16px] text-ink">Actividad reciente</div>
                    <button onClick={() => handleNav('clients')} className="text-[13px] text-brand-700 font-semibold hover:underline">Ver todo</button>
                  </div>
                  {history.length === 0 ? (
                    <p className="text-sm text-neutral-500">Sin actividad aún.</p>
                  ) : (
                    <div className="flex flex-col">
                      {history.slice(0, 5).map(h => (
                        <div key={h.id} className="flex items-center gap-3 py-[11px] border-b border-neutral-300 last:border-0">
                          <div className="w-[34px] h-[34px] rounded-full bg-brand-200 grid place-items-center text-brand-700 shrink-0">
                            <Stamp size={16} strokeWidth={2.75} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[14px] font-bold text-ink">Sello #{h.stamp_number}</div>
                            <div className="text-[12px] text-neutral-600 truncate">
                              {h.card?.loyalty_card?.name || '—'} · {new Date(h.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── TARJETAS ── */}
          {tab === 'cards' && (
            <>
              {cards.length === 0 ? (
                <div className="bg-neutral-100 rounded-lg p-8 md:p-12 text-center shadow-sm">
                  <p className="text-neutral-500 font-medium">Sin tarjetas aún. Haz clic en <strong>Nueva tarjeta</strong> para empezar.</p>
                </div>
              ) : (
                <>
                  {/* móvil: cards apiladas */}
                  <div className="flex flex-col gap-3 md:hidden">
                    {cards.map(c => (
                      <div key={c.id} className="bg-neutral-100 rounded-lg p-4 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-[36px] h-[36px] rounded-[13px] grid place-items-center shrink-0 font-display text-[16px] text-white overflow-hidden"
                            style={{ background: c.primary_color || '#c67139' }}>
                            {c.logo_url ? <img src={c.logo_url} alt="" className="w-full h-full object-cover" /> : (c.name || 'T').charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-ink truncate">{c.name}</div>
                            <div className="text-xs text-neutral-600">{c.total_stamps} sellos · {c.reward}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setQrCard(c)} className="flex-1 flex items-center justify-center gap-1 text-xs font-bold py-2 rounded-full bg-brand-100 text-brand-700"><QrCode size={13} strokeWidth={2.75} />Ver QR</button>
                          <button onClick={() => setEditingCard(c)} className="flex-1 flex items-center justify-center gap-1 text-xs font-bold py-2 rounded-full bg-neutral-200 text-neutral-700"><Pencil size={13} strokeWidth={2.75} />Editar</button>
                          <button onClick={() => deleteCard(c.id)} className="flex-1 flex items-center justify-center gap-1 text-xs font-bold py-2 rounded-full bg-red-100 text-red-600"><Trash2 size={13} strokeWidth={2.75} />Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* desktop: tabla */}
                  <div className="hidden md:block bg-neutral-100 rounded-lg shadow-sm overflow-hidden">
                    <div className="grid gap-4 px-[22px] py-[14px] bg-surface text-[12px] font-black uppercase tracking-wide text-neutral-700 border-b border-neutral-300"
                      style={{ gridTemplateColumns: '2.4fr 1fr 1.4fr 0.7fr' }}>
                      <span>Tarjeta</span><span>Sellos</span><span>Recompensa</span><span>Acciones</span>
                    </div>
                    {cards.map(c => (
                      <div key={c.id}
                        className="grid gap-4 px-[22px] py-[16px] border-b border-neutral-300 last:border-0 items-center"
                        style={{ gridTemplateColumns: '2.4fr 1fr 1.4fr 0.7fr' }}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-[36px] h-[36px] rounded-[13px] grid place-items-center shrink-0 font-display text-[16px] text-white overflow-hidden"
                            style={{ background: c.primary_color || '#c67139' }}>
                            {c.logo_url ? <img src={c.logo_url} alt="" className="w-full h-full object-cover" /> : (c.name || 'T').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[14.5px] font-bold text-ink truncate">{c.name}</div>
                            {c.description && <div className="text-[12.5px] text-neutral-600 truncate">{c.description}</div>}
                          </div>
                        </div>
                        <span className="text-[14px] font-bold text-ink">{c.total_stamps}</span>
                        <span className="text-[13px] text-neutral-700 truncate">{c.reward}</span>
                        <div className="flex gap-1.5">
                          <button onClick={() => setQrCard(c)} className="flex items-center gap-[6px] px-3 h-8 rounded-full bg-brand-100 text-brand-700 hover:bg-brand-200 transition text-[12.5px] font-bold" title="Ver QR"><QrCode size={13} strokeWidth={2.75} />QR</button>
                          <button onClick={() => setEditingCard(c)} className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-700 grid place-items-center hover:bg-neutral-300 transition" title="Editar"><Pencil size={14} strokeWidth={2.75} /></button>
                          <button onClick={() => deleteCard(c.id)} className="w-8 h-8 rounded-full bg-red-100 text-red-600 grid place-items-center hover:bg-red-200 transition" title="Eliminar"><Trash2 size={14} strokeWidth={2.75} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── CLIENTES ── */}
          {tab === 'clients' && (
            <div className="flex flex-col gap-4">

              {/* modal de edición */}
              {editingClient && (
                <div className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-bg rounded-2xl shadow-xl w-full max-w-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-display text-[22px] text-ink">Editar cliente</h3>
                      <button onClick={() => setEditingClient(null)}
                        className="w-9 h-9 rounded-full bg-neutral-200 grid place-items-center hover:bg-neutral-300 transition">
                        <X size={16} strokeWidth={2.75} className="text-neutral-700" />
                      </button>
                    </div>
                    <form onSubmit={saveClient} className="flex flex-col gap-4">
                      <label className="block">
                        <span className="text-[13px] font-bold text-ink block mb-[6px]">Nombre</span>
                        <input type="text" value={clientForm.name}
                          onChange={e => setClientForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Nombre del cliente"
                          className={INP} />
                      </label>
                      <label className="block">
                        <span className="text-[13px] font-bold text-ink block mb-[6px]">Correo electrónico</span>
                        <input type="email" value={clientForm.email}
                          onChange={e => setClientForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="correo@ejemplo.com"
                          className={INP} />
                      </label>
                      <div className="flex gap-2 pt-1">
                        <button type="button" onClick={() => setEditingClient(null)}
                          className="flex-1 border border-neutral-300 text-neutral-700 font-semibold rounded-full py-[11px] text-sm hover:bg-neutral-100 transition">
                          Cancelar
                        </button>
                        <button type="submit" disabled={savingClient}
                          className="flex-1 bg-brand text-white font-bold rounded-full py-[11px] text-sm disabled:opacity-45 hover:bg-brand-600 transition">
                          {savingClient ? 'Guardando…' : 'Guardar'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* buscador */}
              <div className="relative">
                <Search size={15} strokeWidth={2.75}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                <input
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  placeholder="Buscar por nombre o correo…"
                  className="w-full bg-neutral-100 border border-neutral-300 rounded-full py-[11px] pl-10 pr-4 text-sm text-ink placeholder:text-neutral-500 outline-none focus:ring-2 focus:ring-brand/40 transition"
                />
              </div>

              {/* stats rápidas */}
              {clients.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total clientes', value: clients.length },
                    { label: 'Con correo',     value: clients.filter(c => c.email).length },
                    { label: 'Tarjetas activas', value: clients.reduce((s, c) => s + (c.cards?.filter(cc => cc.status === 'active').length || 0), 0) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-neutral-100 rounded-xl p-3 text-center shadow-sm">
                      <div className="font-display text-[26px] text-ink">{value}</div>
                      <div className="text-[11px] text-neutral-600 font-semibold mt-[2px]">{label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* lista */}
              {clients.length === 0 ? (
                <div className="bg-neutral-100 rounded-xl p-8 md:p-12 text-center shadow-sm">
                  <Users size={40} strokeWidth={2} className="mx-auto mb-3 text-neutral-300" />
                  <p className="font-semibold text-ink">Aún no hay clientes</p>
                  <p className="text-sm text-neutral-600 mt-1">Aparecerán aquí cuando escaneen el QR de bienvenida.</p>
                </div>
              ) : (() => {
                const q = clientSearch.toLowerCase().trim();
                const visible = q
                  ? clients.filter(c =>
                      (c.name || '').toLowerCase().includes(q) ||
                      (c.email || '').toLowerCase().includes(q))
                  : clients;

                return visible.length === 0 ? (
                  <div className="bg-neutral-100 rounded-xl p-6 text-center text-neutral-600 text-sm shadow-sm">
                    Sin resultados para "<span className="font-semibold">{clientSearch}</span>"
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {visible.map(cl => {
                      const initials = (cl.name || 'C').slice(0, 2).toUpperCase();
                      const totalStamps = (cl.cards || []).reduce((s, c) => s + c.stamps, 0);
                      const hasReward   = (cl.cards || []).some(c => c.status === 'completed' || c.status === 'reward_claimed');
                      return (
                        <div key={cl.id} className="bg-neutral-100 rounded-xl shadow-sm overflow-hidden">
                          {/* cabecera cliente */}
                          <div className="flex items-center gap-3 px-4 py-4">
                            <div className="w-11 h-11 rounded-full bg-brand-200 grid place-items-center font-bold text-[15px] text-brand-800 shrink-0">
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-[15px] text-ink">
                                  {cl.name || `Cliente #${String(cl.id).slice(0, 6)}`}
                                </span>
                                {hasReward && (
                                  <span className="text-[11px] font-bold px-2 py-[2px] rounded-full bg-sage-200 text-sage-800">🎉 Recompensa</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-[2px] flex-wrap">
                                {cl.email ? (
                                  <span className="flex items-center gap-1 text-[12px] text-neutral-500">
                                    <Mail size={11} strokeWidth={2.75} />{cl.email}
                                  </span>
                                ) : (
                                  <span className="text-[12px] text-neutral-400 italic">Sin correo</span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => { setEditingClient(cl); setClientForm({ name: cl.name || '', email: cl.email || '' }); }}
                              className="w-9 h-9 rounded-full bg-neutral-200 grid place-items-center text-neutral-600 hover:bg-neutral-300 transition shrink-0">
                              <Pencil size={14} strokeWidth={2.75} />
                            </button>
                          </div>

                          {/* tarjetas del cliente */}
                          {cl.cards?.length > 0 && (
                            <div className="border-t border-neutral-200 px-4 py-3 flex flex-col gap-2">
                              {cl.cards.map((cc, i) => (
                                <div key={i} className="flex items-center justify-between text-[13px]">
                                  <span className="text-neutral-700 truncate flex-1">{cc.card_name}</span>
                                  <div className="flex items-center gap-2 shrink-0 ml-3">
                                    <span className="font-bold text-ink">{cc.stamps}/{cc.total_stamps}</span>
                                    {cc.status === 'reward_claimed' && <span className="text-[11px] font-bold px-2 py-[1px] rounded-full bg-neutral-300 text-neutral-600">Canjeada</span>}
                                    {cc.status === 'completed'      && <span className="text-[11px] font-bold px-2 py-[1px] rounded-full bg-sage-200 text-sage-800">Lista</span>}
                                    {cc.status === 'active'         && <span className="text-[11px] font-bold px-2 py-[1px] rounded-full bg-brand-200 text-brand-800">Activa</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* pie con fecha */}
                          <div className="border-t border-neutral-200 px-4 py-[8px] flex items-center justify-between">
                            <span className="text-[11.5px] text-neutral-500">
                              Desde {new Date(cl.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[11.5px] text-neutral-500 font-semibold">
                              {cl.cards?.length || 0} tarjeta{cl.cards?.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── EMPLEADOS ── */}
          {tab === 'employees' && (
            <div className="flex flex-col gap-[18px]">

              {/* grid de tarjetas */}
              {employees.length === 0 ? (
                <div className="bg-neutral-100 rounded-lg p-12 text-center text-neutral-500 shadow-sm">
                  <IdCard size={40} strokeWidth={2} className="mx-auto mb-3 text-neutral-300" />
                  <p className="font-bold text-neutral-600">Aún no hay empleados</p>
                  <p className="text-[13px] mt-1">Usa el botón "Nuevo empleado" para agregar el primero.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {employees.map((emp, idx) => {
                    const parts = (emp.full_name || '').trim().split(/\s+/);
                    const initials2 = parts.length >= 2
                      ? (parts[0][0] + parts[1][0]).toUpperCase()
                      : (emp.full_name || 'E').slice(0, 2).toUpperCase();
                    const COLORS = ['bg-brand-600', 'bg-sage-600', 'bg-amber-500', 'bg-purple-500'];
                    const avatarColor = emp.is_active ? COLORS[idx % COLORS.length] : 'bg-neutral-500';
                    return (
                      <div key={emp.id}
                        className={`bg-neutral-100 rounded-xl p-5 flex flex-col gap-[14px] shadow-sm transition-opacity ${emp.is_active ? '' : 'opacity-60'}`}>
                        {/* header tarjeta */}
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full ${avatarColor} grid place-items-center text-white font-extrabold text-[16px] shrink-0`}>
                            {initials2}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-extrabold text-[16px] text-ink truncate">{emp.full_name}</div>
                            <div className="text-[12.5px] text-neutral-600 truncate">{emp.email}</div>
                          </div>
                          <span className={`text-[11.5px] font-extrabold px-[11px] py-[5px] rounded-full shrink-0 ${
                            emp.is_active ? 'bg-sage-200 text-sage-800' : 'bg-neutral-300 text-neutral-800'
                          }`}>
                            {emp.is_active ? 'Activa' : 'Pausada'}
                          </span>
                        </div>

                        {/* stats */}
                        <div className="flex gap-5">
                          <div>
                            <div className="text-[11.5px] text-neutral-600 font-bold">Sellos (30d)</div>
                            <div className="font-display text-[22px] leading-[1.15] text-ink">—</div>
                          </div>
                          <div>
                            <div className="text-[11.5px] text-neutral-600 font-bold">Canjes</div>
                            <div className="font-display text-[22px] leading-[1.15] text-ink">—</div>
                          </div>
                        </div>

                        {/* footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-neutral-300">
                          <span className="text-[12.5px] text-neutral-700">Sucursal Centro</span>
                          <div className="flex gap-[7px]">
                            <button title="Editar"
                              className="w-[30px] h-[30px] rounded-full border border-neutral-300 grid place-items-center text-neutral-700 hover:bg-neutral-200 transition">
                              <Pencil size={14} strokeWidth={2.75} />
                            </button>
                            <button title={emp.is_active ? 'Desactivar' : 'Activar'}
                              onClick={() => toggleEmployee(emp)}
                              className="w-[30px] h-[30px] rounded-full border border-neutral-300 grid place-items-center text-neutral-700 hover:bg-neutral-200 transition">
                              <Power size={14} strokeWidth={2.75} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* banner de seguridad */}
              <div className="bg-brand-100 border-2 border-dashed border-brand-300 rounded-xl p-[22px] flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-brand-200 grid place-items-center text-brand-700 shrink-0">
                  <ShieldCheck size={21} strokeWidth={2.75} />
                </div>
                <div className="flex-1">
                  <div className="font-extrabold text-[15px] text-brand-900">Los empleados solo operan tarjetas de tu negocio</div>
                  <div className="text-[13.5px] text-brand-800 leading-[1.45] mt-[2px]">
                    No pueden crear tarjetas, ver datos de otros negocios ni borrar sellos ya registrados.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── NEGOCIO ── */}
          {tab === 'business' && (
            <form onSubmit={saveBusiness} className="max-w-lg bg-neutral-100 rounded-lg p-5 md:p-6 space-y-5 shadow-sm">
              <p className="font-display text-[22px] text-ink">{business ? 'Actualizar negocio' : 'Crear negocio'}</p>
              <Field label="Nombre del negocio"><input className={INP} required value={bizForm.name} onChange={e => setBizForm({ ...bizForm, name: e.target.value })} /></Field>
              <Field label="Descripción"><textarea className={INP2 + ' h-24'} value={bizForm.description} onChange={e => setBizForm({ ...bizForm, description: e.target.value })} /></Field>
              <Field label="Logo del negocio"><LogoUploader initial={bizForm.logo_url} onUploaded={url => setBizForm({ ...bizForm, logo_url: url })} /></Field>
              <div className="flex gap-4">
                <Field label="Color principal" className="flex-1">
                  <input type="color" className="w-full h-12 mt-[7px] rounded-md cursor-pointer" value={bizForm.primary_color} onChange={e => setBizForm({ ...bizForm, primary_color: e.target.value })} />
                </Field>
                <Field label="Color secundario" className="flex-1">
                  <input type="color" className="w-full h-12 mt-[7px] rounded-md cursor-pointer" value={bizForm.secondary_color} onChange={e => setBizForm({ ...bizForm, secondary_color: e.target.value })} />
                </Field>
              </div>
              <button className="w-full bg-brand-600 text-white font-bold py-3 rounded-full hover:bg-brand-700 transition">
                {business ? 'Actualizar negocio' : 'Crear negocio'}
              </button>
            </form>
          )}

          {/* ── REDES SOCIALES ── */}
          {tab === 'social' && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 md:gap-6 items-start">
              <form onSubmit={saveSocial} className="bg-neutral-100 rounded-lg p-5 md:p-6 space-y-5 shadow-sm">
                <p className="font-display text-[22px] text-ink">Redes sociales</p>
                <p className="text-sm text-neutral-600">Estos datos aparecen en el pie de página de tu wallet y página de inicio.</p>
                <Field label="Facebook (URL completa)"><input className={INP} type="url" placeholder="https://facebook.com/tunegocio" value={socialForm.facebook_url} onChange={e => setSocialForm({ ...socialForm, facebook_url: e.target.value })} /></Field>
                <Field label="Instagram (URL completa)"><input className={INP} type="url" placeholder="https://instagram.com/tunegocio" value={socialForm.instagram_url} onChange={e => setSocialForm({ ...socialForm, instagram_url: e.target.value })} /></Field>
                <Field label="Correo electrónico de contacto"><input className={INP} type="email" placeholder="contacto@tunegocio.com" value={socialForm.contact_email} onChange={e => setSocialForm({ ...socialForm, contact_email: e.target.value })} /></Field>
                <Field label="Texto de derechos reservados"><input className={INP} placeholder="© 2025 Todos los derechos reservados" value={socialForm.footer_text} onChange={e => setSocialForm({ ...socialForm, footer_text: e.target.value })} /></Field>
                <button type="submit" className="w-full bg-brand-600 text-white font-bold py-3 rounded-full hover:bg-brand-700 transition">Guardar redes sociales</button>
              </form>

              <div className="bg-neutral-900 rounded-lg p-6 text-center space-y-4">
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Vista previa del pie</p>
                <div className="flex justify-center gap-6">
                  {socialForm.facebook_url && (
                    <span className="text-blue-400"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></span>
                  )}
                  {socialForm.instagram_url && (
                    <span className="text-pink-400"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></span>
                  )}
                  {socialForm.contact_email && (
                    <span className="text-neutral-300"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
                  )}
                </div>
                {!socialForm.facebook_url && !socialForm.instagram_url && !socialForm.contact_email && (
                  <p className="text-neutral-500 text-xs">Agrega al menos una red para ver la vista previa.</p>
                )}
                <p className="text-xs text-neutral-500">{socialForm.footer_text || '© 2025 Todos los derechos reservados'}</p>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── MODAL nuevo empleado ── */}
      {showEmpModal && (
        <div className="fixed inset-0 z-50 bg-ink/[.42] flex items-center justify-center p-4">
          <div className="w-full max-w-[480px] bg-bg rounded-xl shadow-xl overflow-hidden">

            {/* header */}
            <div className="px-[30px] pt-[26px] pb-4 flex items-start justify-between">
              <div>
                <h4 className="font-display font-normal text-[26px] text-ink leading-[1.05] m-0">Nuevo empleado</h4>
                <div className="text-[13px] text-neutral-600 mt-1">Recibirá sus credenciales para acceder</div>
              </div>
              <button onClick={() => { setShowEmpModal(false); setShowEmpPw(false); }}
                className="w-9 h-9 rounded-full bg-neutral-200 grid place-items-center text-neutral-800 hover:bg-neutral-300 transition shrink-0">
                <X size={17} strokeWidth={2.75} />
              </button>
            </div>

            {/* body */}
            <form id="emp-form" onSubmit={createEmployee} className="px-[30px] pb-[22px] flex flex-col gap-[15px]">

              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-extrabold text-ink">Nombre completo</label>
                <input
                  className={`${INP} border-2 border-brand-500 focus:border-brand-500`}
                  placeholder="Marta Solís"
                  required
                  value={empForm.full_name}
                  onChange={e => setEmpForm({ ...empForm, full_name: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-extrabold text-ink">Correo electrónico</label>
                <input
                  type="email"
                  className={INP}
                  placeholder="empleado@tunegocio.com"
                  required
                  value={empForm.email}
                  onChange={e => setEmpForm({ ...empForm, email: e.target.value })}
                />
              </div>

              <div className="flex flex-col gap-[7px]">
                <label className="text-[13px] font-extrabold text-ink">Contraseña</label>
                <div className="relative">
                  <input
                    type={showEmpPw ? 'text' : 'password'}
                    className={`${INP} pr-[48px]`}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    value={empForm.password}
                    onChange={e => setEmpForm({ ...empForm, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmpPw(v => !v)}
                    className="absolute right-[18px] top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 transition">
                    {showEmpPw
                      ? <EyeOff size={17} strokeWidth={2.75} />
                      : <Eye    size={17} strokeWidth={2.75} />}
                  </button>
                </div>
                <p className="text-[12px] text-neutral-500 px-1">
                  Comparte esta contraseña con el empleado para que pueda iniciar sesión.
                </p>
              </div>

              <div className="flex flex-col gap-[9px]">
                <label className="text-[13px] font-extrabold text-ink">Sucursal</label>
                <div className="flex gap-2">
                  {['Centro', 'Norte'].map(b => (
                    <button key={b} type="button"
                      onClick={() => setEmpBranch(b)}
                      className={`flex-1 text-center text-[14px] font-bold py-3 rounded-full transition ${
                        empBranch === b
                          ? 'bg-brand-600 text-white'
                          : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                      }`}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between bg-neutral-100 rounded-lg px-[18px] py-[14px]">
                <div>
                  <div className="text-[14px] font-bold text-ink">Puede canjear recompensas</div>
                  <div className="text-[12.5px] text-neutral-600">Además de registrar sellos</div>
                </div>
                <button type="button" onClick={() => setEmpCanRedeem(v => !v)}
                  className={`w-12 h-7 rounded-full flex items-center transition-colors ${empCanRedeem ? 'bg-sage-500 justify-end' : 'bg-neutral-300 justify-start'} px-[3px]`}>
                  <div className="w-[22px] h-[22px] rounded-full bg-white shadow-sm" />
                </button>
              </div>
            </form>

            {/* footer */}
            <div className="px-[30px] pb-[26px] pt-4 border-t border-neutral-300 flex gap-3">
              <button type="button" onClick={() => { setShowEmpModal(false); setShowEmpPw(false); }}
                className="flex-1 border border-neutral-400 text-neutral-800 font-bold text-[15px] py-[14px] rounded-full hover:bg-neutral-100 transition">
                Cancelar
              </button>
              <button type="submit" form="emp-form"
                className="flex-[2] bg-brand text-white font-extrabold text-[15px] py-[14px] rounded-full shadow-sm hover:bg-brand-600 transition">
                Crear empleado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DRAWER nueva tarjeta ── */}
      {showCardForm && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setShowCardForm(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-full sm:w-[466px] bg-bg shadow-lg flex flex-col sm:rounded-[28px_0_0_28px]">
            <div className="flex-none px-5 md:px-[30px] pt-5 md:pt-[26px] pb-[18px] border-b border-neutral-300 flex items-start justify-between">
              <div>
                <h4 className="font-display text-[22px] md:text-[26px] text-ink leading-tight m-0">Nueva tarjeta</h4>
                <div className="text-[13px] text-neutral-600 mt-1">Se genera su QR de bienvenida al guardar</div>
              </div>
              <button onClick={() => setShowCardForm(false)}
                className="w-[38px] h-[38px] rounded-full bg-neutral-200 grid place-items-center text-neutral-800 hover:bg-neutral-300 transition shrink-0">
                <X size={18} strokeWidth={2.75} />
              </button>
            </div>
            <form onSubmit={createCard} className="flex-1 overflow-y-auto px-5 md:px-[30px] py-5 md:py-[22px] flex flex-col gap-[18px]">
              <Field label="Nombre de la tarjeta"><input className={INP} required value={cardForm.name} onChange={e => setCardForm({ ...cardForm, name: e.target.value })} /></Field>
              <Field label="Recompensa"><input className={INP} required value={cardForm.reward} onChange={e => setCardForm({ ...cardForm, reward: e.target.value })} /></Field>
              <Field label="Descripción"><input className={INP} value={cardForm.description} onChange={e => setCardForm({ ...cardForm, description: e.target.value })} /></Field>
              <Field label="Sellos necesarios">
                <div className="flex gap-2">
                  {STAMP_OPTIONS.map(n => (
                    <button key={n} type="button" onClick={() => setCardForm({ ...cardForm, total_stamps: n })}
                      className={`flex-1 text-center text-[14px] font-bold py-[11px] rounded-full transition ${
                        cardForm.total_stamps === n ? 'bg-brand-600 text-white' : 'border border-neutral-300 text-neutral-700 hover:border-brand'
                      }`}>{n}</button>
                  ))}
                </div>
              </Field>
              <Field label="Logo de la tarjeta"><LogoUploader initial={cardForm.logo_url} onUploaded={url => setCardForm({ ...cardForm, logo_url: url })} /></Field>
              <div className="flex gap-4">
                <Field label="Color principal" className="flex-1">
                  <input type="color" className="w-full h-12 mt-[7px] rounded-md cursor-pointer" value={cardForm.primary_color} onChange={e => setCardForm({ ...cardForm, primary_color: e.target.value })} />
                </Field>
                <Field label="Color secundario" className="flex-1">
                  <input type="color" className="w-full h-12 mt-[7px] rounded-md cursor-pointer" value={cardForm.secondary_color} onChange={e => setCardForm({ ...cardForm, secondary_color: e.target.value })} />
                </Field>
              </div>
              <div className="flex gap-3 pt-2 pb-6">
                <button type="button" onClick={() => setShowCardForm(false)}
                  className="flex-1 border border-neutral-300 text-neutral-700 rounded-full py-3 font-medium hover:bg-neutral-100 transition">Cancelar</button>
                <button type="submit"
                  className="flex-1 bg-brand-600 text-white font-bold rounded-full py-3 hover:bg-brand-700 transition">Crear tarjeta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div key={toastKey}
          className={`toast-enter fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3
            px-6 py-[14px] rounded-full shadow-lg text-[15px] font-bold pointer-events-none whitespace-nowrap
            ${toast.type === 'success' ? 'bg-sage-700 text-white' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success'
            ? <CheckCircle2 size={18} strokeWidth={2.75} className="shrink-0" />
            : <AlertCircle  size={18} strokeWidth={2.75} className="shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* modales */}
      {editingCard && <EditCardModal card={editingCard} onSave={onCardSaved} onClose={() => setEditingCard(null)} />}
      {qrCard      && <WelcomeQrModal card={qrCard} onClose={() => setQrCard(null)} />}
    </div>
  );
}
