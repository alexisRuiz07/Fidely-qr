import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import LogoUploader from '../components/LogoUploader.jsx';
import LanguageSwitcher from '../components/LanguageSwitcher.jsx';
import { useLang } from '../i18n/index.jsx';
import { api } from '../services/api.js';

// ─── helpers ────────────────────────────────────────────────────────────────

function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 overflow-x-auto mb-4 pb-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap font-medium transition-colors ${
            active === t.key
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      {children}
    </label>
  );
}

function Toast({ msg, type = 'success' }) {
  if (!msg) return null;
  const color = type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700';
  return <div className={`${color} p-3 rounded-xl text-sm mb-4`}>{msg}</div>;
}

const inp = 'w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400';

// ─── modal edición tarjeta ───────────────────────────────────────────────────

function EditCardModal({ card, onSave, onClose }) {
  const [form, setForm] = useState({
    name: card.name,
    description: card.description || '',
    logo_url: card.logo_url || '',
    total_stamps: card.total_stamps,
    reward: card.reward,
    primary_color: card.primary_color || '#1f2937',
    secondary_color: card.secondary_color || '#f59e0b',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      const r = await api.updateCard(card.id, { ...form, total_stamps: Number(form.total_stamps) });
      onSave(r.card);
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between">
          <p className="font-bold text-gray-900">Editar tarjeta</p>
          <button onClick={onClose} className="text-gray-400 text-xl leading-none">✕</button>
        </div>

        {err && <p className="text-red-600 text-sm">{err}</p>}

        <form onSubmit={submit} className="space-y-3">
          <Field label="Nombre">
            <input className={inp} required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Descripción">
            <input className={inp} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div>
            <span className="text-xs text-gray-500 font-medium block mb-2">Logo</span>
            <LogoUploader initial={form.logo_url}
              onUploaded={(url) => setForm({ ...form, logo_url: url })} />
          </div>
          <div className="flex gap-2">
            <Field label="Sellos">
              <input type="number" min={1} className={inp} value={form.total_stamps}
                onChange={(e) => setForm({ ...form, total_stamps: e.target.value })} />
            </Field>
            <Field label="Recompensa">
              <input className={inp} required value={form.reward}
                onChange={(e) => setForm({ ...form, reward: e.target.value })} />
            </Field>
          </div>
          <div className="flex gap-3">
            <Field label="Color principal">
              <input type="color" className="w-16 h-9 mt-1" value={form.primary_color}
                onChange={(e) => setForm({ ...form, primary_color: e.target.value })} />
            </Field>
            <Field label="Color secundario">
              <input type="color" className="w-16 h-9 mt-1" value={form.secondary_color}
                onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} />
            </Field>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 rounded-xl py-2 text-sm font-medium">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-amber-400 text-gray-900 font-bold rounded-xl py-2 text-sm disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── modal QR bienvenida ─────────────────────────────────────────────────────

function WelcomeQrModal({ card, onClose }) {
  const url = `${window.location.origin}/welcome/${card.id}`;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xs p-6 text-center space-y-4">
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-gray-900">QR de bienvenida</p>
          <button onClick={onClose} className="text-gray-400 text-xl leading-none">✕</button>
        </div>
        <p className="text-sm text-gray-600">
          El cliente escanea este QR para agregar <strong>{card.name}</strong> a su wallet.
        </p>
        <div className="flex justify-center">
          <div className="bg-white p-3 border rounded-xl inline-block">
            <QRCodeSVG value={url} size={200} fgColor="#111827" />
          </div>
        </div>
        <p className="text-xs text-gray-400 break-all">{url}</p>
        <button
          onClick={() => navigator.clipboard?.writeText(url)}
          className="w-full bg-gray-100 text-gray-700 rounded-xl py-2 text-sm font-medium"
        >
          Copiar enlace
        </button>
        <button onClick={onClose}
          className="w-full bg-gray-900 text-white rounded-xl py-2 text-sm font-bold">
          Cerrar
        </button>
      </div>
    </div>
  );
}

// ─── componente principal ────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [tab, setTab] = useState('business');

  const [business, setBusiness] = useState(null);
  const [cards, setCards] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);

  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const [editingCard, setEditingCard] = useState(null);
  const [qrCard, setQrCard] = useState(null);

  // forms
  const [bizForm, setBizForm] = useState({
    name: '', description: '', logo_url: '', primary_color: '#1f2937', secondary_color: '#f59e0b',
  });
  const [socialForm, setSocialForm] = useState({
    facebook_url: '', instagram_url: '', contact_email: '', footer_text: '© 2025 Todos los derechos reservados',
  });
  const [cardForm, setCardForm] = useState({
    name: '', description: '', logo_url: '', total_stamps: 8, reward: '',
    primary_color: '#1f2937', secondary_color: '#f59e0b',
  });
  const [empForm, setEmpForm] = useState({ email: '', password: '', full_name: '' });

  function notify(m) { setMsg(m); setTimeout(() => setMsg(''), 3000); }
  function notifyErr(m) { setErr(m); setTimeout(() => setErr(''), 4000); }

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [bs, cd, em] = await Promise.all([
        api.get('/api/businesses/me'),
        api.get('/api/cards'),
        api.get('/api/employees'),
      ]);
      setBusiness(bs.business || null);
      setCards(cd.cards || []);
      setEmployees(em.employees || []);
      if (bs.business) {
        const biz = bs.business;
        setBizForm({
          name: biz.name,
          description: biz.description || '',
          logo_url: biz.logo_url || '',
          primary_color: biz.primary_color || '#1f2937',
          secondary_color: biz.secondary_color || '#f59e0b',
        });
        setSocialForm({
          facebook_url: biz.facebook_url || '',
          instagram_url: biz.instagram_url || '',
          contact_email: biz.contact_email || '',
          footer_text: biz.footer_text || '© 2025 Todos los derechos reservados',
        });
      }
    } catch (e) {
      if (e.status === 401) {
        localStorage.removeItem('token');
        navigate('/admin/login');
      } else {
        notifyErr('No se pudo cargar: ' + e.message);
      }
    }
  }

  async function loadClientsData() {
    try {
      const [cl, st, hi] = await Promise.all([
        api.getClients(),
        api.getStats(),
        api.getStampsHistory(),
      ]);
      setClients(cl.clients || []);
      setStats(st);
      setHistory(hi.history || []);
    } catch (e) {
      notifyErr('Error cargando datos: ' + e.message);
    }
  }

  function handleTabChange(key) {
    setTab(key);
    if ((key === 'clients' || key === 'stats' || key === 'history') && !stats) {
      loadClientsData();
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user_role');
    navigate('/');
  }

  // ── NEGOCIO ──────────────────────────────────────────────────────────────

  async function saveBusiness(e) {
    e.preventDefault();
    try {
      const r = business
        ? await api.patch(`/api/businesses/${business.id}`, bizForm)
        : await api.post('/api/businesses', bizForm);
      setBusiness(r.business);
      notify(business ? 'Negocio actualizado' : 'Negocio creado');
    } catch (e2) { notifyErr(e2.message); }
  }

  // ── REDES SOCIALES / FOOTER ──────────────────────────────────────────────

  async function saveSocial(e) {
    e.preventDefault();
    if (!business) return notifyErr('Primero crea tu negocio');
    try {
      const r = await api.patch(`/api/businesses/${business.id}`, socialForm);
      setBusiness(r.business);
      notify('Redes sociales actualizadas');
    } catch (e2) { notifyErr(e2.message); }
  }

  // ── TARJETAS ─────────────────────────────────────────────────────────────

  async function createCard(e) {
    e.preventDefault();
    try {
      const r = await api.post('/api/cards', { ...cardForm, total_stamps: Number(cardForm.total_stamps) });
      setCards((c) => [r.card, ...c]);
      setCardForm({ name: '', description: '', logo_url: '', total_stamps: 8, reward: '', primary_color: '#1f2937', secondary_color: '#f59e0b' });
      notify('Tarjeta creada');
    } catch (e2) { notifyErr(e2.message); }
  }

  function onCardSaved(updated) {
    setCards((c) => c.map((x) => (x.id === updated.id ? updated : x)));
    setEditingCard(null);
    notify('Tarjeta actualizada');
  }

  async function deleteCard(id) {
    if (!confirm('¿Eliminar esta tarjeta? Los clientes perderán sus sellos.')) return;
    try {
      await api.deleteCard(id);
      setCards((c) => c.filter((x) => x.id !== id));
      notify('Tarjeta eliminada');
    } catch (e2) { notifyErr(e2.message); }
  }

  // ── EMPLEADOS ────────────────────────────────────────────────────────────

  async function createEmployee(e) {
    e.preventDefault();
    try {
      const r = await api.post('/api/employees', empForm);
      setEmployees((em) => [r.employee, ...em]);
      setEmpForm({ email: '', password: '', full_name: '' });
      notify('Empleado creado');
    } catch (e2) { notifyErr(e2.message); }
  }

  async function toggleEmployee(emp) {
    try {
      const r = await api.toggleEmployee(emp.id, !emp.is_active);
      setEmployees((em) => em.map((x) => (x.id === emp.id ? r.employee : x)));
      notify(r.employee.is_active ? 'Empleado activado' : 'Empleado desactivado');
    } catch (e2) { notifyErr(e2.message); }
  }

  async function deleteEmployee(id) {
    if (!confirm('¿Eliminar este empleado?')) return;
    try {
      await api.deleteEmployee(id);
      setEmployees((em) => em.filter((x) => x.id !== id));
      notify('Empleado eliminado');
    } catch (e2) { notifyErr(e2.message); }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      {/* header */}
      <header className="bg-gray-900 text-white p-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{business?.name || 'Panel Admin'}</h1>
          <p className="text-gray-400 text-xs">Administración de tu negocio</p>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher dark />
          <button onClick={logout} className="text-sm text-gray-400 underline">Salir</button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4">
        <Toast msg={msg} type="success" />
        <Toast msg={err} type="error" />

        <Tabs
          tabs={[
            { key: 'business', label: 'Negocio' },
            { key: 'cards', label: 'Tarjetas' },
            { key: 'employees', label: 'Empleados' },
            { key: 'clients', label: 'Clientes' },
            { key: 'stats', label: 'Estadísticas' },
            { key: 'history', label: 'Historial' },
            { key: 'social', label: 'Redes' },
          ]}
          active={tab}
          onChange={handleTabChange}
        />

        {/* ── NEGOCIO ───────────────────────────────────────────────────── */}
        {tab === 'business' && (
          <form onSubmit={saveBusiness} className="bg-white rounded-2xl p-4 space-y-3">
            {business && (
              <p className="text-sm text-green-600 font-semibold">✓ Negocio: {business.name}</p>
            )}
            <Field label="Nombre del negocio">
              <input className={inp} required value={bizForm.name}
                onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })} />
            </Field>
            <Field label="Descripción">
              <textarea className={inp} value={bizForm.description}
                onChange={(e) => setBizForm({ ...bizForm, description: e.target.value })} />
            </Field>
            <div>
              <span className="text-xs text-gray-500 font-medium block mb-2">Logo del negocio</span>
              <LogoUploader initial={bizForm.logo_url}
                onUploaded={(url) => setBizForm({ ...bizForm, logo_url: url })} />
            </div>
            <div className="flex gap-3">
              <Field label="Color principal">
                <input type="color" className="w-16 h-9 mt-1" value={bizForm.primary_color}
                  onChange={(e) => setBizForm({ ...bizForm, primary_color: e.target.value })} />
              </Field>
              <Field label="Color secundario">
                <input type="color" className="w-16 h-9 mt-1" value={bizForm.secondary_color}
                  onChange={(e) => setBizForm({ ...bizForm, secondary_color: e.target.value })} />
              </Field>
            </div>
            <button className="w-full bg-gray-900 text-white font-bold py-2.5 rounded-xl">
              {business ? 'Actualizar negocio' : 'Crear negocio'}
            </button>
          </form>
        )}

        {/* ── TARJETAS ──────────────────────────────────────────────────── */}
        {tab === 'cards' && (
          <div className="space-y-4">
            {/* formulario nueva tarjeta */}
            <form onSubmit={createCard} className="bg-white rounded-2xl p-4 space-y-3">
              <p className="font-semibold text-sm text-gray-900">Nueva tarjeta de fidelización</p>
              <Field label="Nombre">
                <input className={inp} required value={cardForm.name}
                  onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })} />
              </Field>
              <Field label="Descripción">
                <input className={inp} value={cardForm.description}
                  onChange={(e) => setCardForm({ ...cardForm, description: e.target.value })} />
              </Field>
              <div>
                <span className="text-xs text-gray-500 font-medium block mb-2">Logo</span>
                <LogoUploader initial={cardForm.logo_url}
                  onUploaded={(url) => setCardForm({ ...cardForm, logo_url: url })} />
              </div>
              <div className="flex gap-2">
                <div className="w-28">
                  <Field label="Sellos">
                    <input type="number" min={1} className={inp} value={cardForm.total_stamps}
                      onChange={(e) => setCardForm({ ...cardForm, total_stamps: Number(e.target.value) })} />
                  </Field>
                </div>
                <div className="flex-1">
                  <Field label="Recompensa">
                    <input className={inp} required value={cardForm.reward}
                      onChange={(e) => setCardForm({ ...cardForm, reward: e.target.value })} />
                  </Field>
                </div>
              </div>
              <div className="flex gap-3">
                <Field label="Color principal">
                  <input type="color" className="w-16 h-9 mt-1" value={cardForm.primary_color}
                    onChange={(e) => setCardForm({ ...cardForm, primary_color: e.target.value })} />
                </Field>
                <Field label="Color secundario">
                  <input type="color" className="w-16 h-9 mt-1" value={cardForm.secondary_color}
                    onChange={(e) => setCardForm({ ...cardForm, secondary_color: e.target.value })} />
                </Field>
              </div>
              <button className="w-full bg-amber-400 text-gray-900 font-bold py-2.5 rounded-xl">
                Crear tarjeta
              </button>
            </form>

            {/* lista de tarjetas */}
            {cards.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-6">Aún no hay tarjetas.</p>
            ) : (
              cards.map((c) => (
                <div key={c.id} className="bg-white rounded-2xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {c.logo_url && (
                          <img src={c.logo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        )}
                        <p className="font-bold text-gray-900 truncate">{c.name}</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{c.total_stamps} sellos → {c.reward}</p>
                      {c.description && (
                        <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <div className="w-4 h-4 rounded-full border" style={{ background: c.primary_color }} />
                      <div className="w-4 h-4 rounded-full border" style={{ background: c.secondary_color }} />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setQrCard(c)}
                      className="flex-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg py-1.5 text-xs font-semibold"
                    >
                      Ver QR
                    </button>
                    <button
                      onClick={() => setEditingCard(c)}
                      className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-1.5 text-xs font-semibold"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteCard(c.id)}
                      className="flex-1 bg-red-50 text-red-600 border border-red-200 rounded-lg py-1.5 text-xs font-semibold"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── EMPLEADOS ─────────────────────────────────────────────────── */}
        {tab === 'employees' && (
          <div className="space-y-4">
            <form onSubmit={createEmployee} className="bg-white rounded-2xl p-4 space-y-3">
              <p className="font-semibold text-sm text-gray-900">Nuevo empleado</p>
              <Field label="Nombre">
                <input className={inp} required value={empForm.full_name}
                  onChange={(e) => setEmpForm({ ...empForm, full_name: e.target.value })} />
              </Field>
              <Field label="Email">
                <input type="email" className={inp} required value={empForm.email}
                  onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} />
              </Field>
              <Field label="Contraseña">
                <input type="password" className={inp} required minLength={6} value={empForm.password}
                  onChange={(e) => setEmpForm({ ...empForm, password: e.target.value })} />
              </Field>
              <button className="w-full bg-green-600 text-white font-bold py-2.5 rounded-xl">
                Crear empleado
              </button>
            </form>

            {employees.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-6">Aún no hay empleados.</p>
            ) : (
              employees.map((e) => (
                <div key={e.id} className="bg-white rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{e.full_name}</p>
                      <p className="text-sm text-gray-500">{e.email}</p>
                    </div>
                    <span className={`text-xs py-1 px-2 rounded-full font-semibold ${
                      e.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {e.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleEmployee(e)}
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold border ${
                        e.is_active
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-green-50 text-green-700 border-green-200'
                      }`}
                    >
                      {e.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => deleteEmployee(e.id)}
                      className="flex-1 bg-red-50 text-red-600 border border-red-200 rounded-lg py-1.5 text-xs font-semibold"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── CLIENTES ──────────────────────────────────────────────────── */}
        {tab === 'clients' && (
          <div className="space-y-3">
            {clients.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-3">👥</p>
                <p className="font-semibold">Aún no hay clientes</p>
                <p className="text-sm">Los clientes aparecerán aquí cuando escaneen el QR de bienvenida.</p>
              </div>
            ) : (
              clients.map((cl) => (
                <div key={cl.id} className="bg-white rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-900">{cl.name || 'Cliente'}</p>
                    {cl.email && <p className="text-xs text-gray-400">{cl.email}</p>}
                  </div>
                  <div className="space-y-1">
                    {(cl.cards || []).map((cc, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{cc.card_name}</span>
                        <span className="font-semibold text-gray-900">
                          {cc.stamps}/{cc.total_stamps}
                          {cc.status === 'reward_claimed' && (
                            <span className="ml-1 text-xs text-green-600">✓</span>
                          )}
                          {cc.status === 'completed' && (
                            <span className="ml-1 text-xs text-amber-500">🎉</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── ESTADÍSTICAS ──────────────────────────────────────────────── */}
        {tab === 'stats' && (
          <div>
            {!stats ? (
              <p className="text-center text-gray-500 py-12">Cargando estadísticas...</p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Tarjetas activas', value: stats.total_cards ?? 0, icon: '💳' },
                    { label: 'Sellos registrados', value: stats.total_stamps ?? 0, icon: '✅' },
                    { label: 'Recompensas canjeadas', value: stats.total_claims ?? 0, icon: '🎁' },
                    { label: 'Empleados', value: employees.length, icon: '👤' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl p-4 text-center">
                      <p className="text-3xl mb-1">{s.icon}</p>
                      <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white rounded-2xl p-4">
                  <p className="font-semibold text-gray-900 mb-3">Tarjetas creadas</p>
                  {cards.length === 0 ? (
                    <p className="text-sm text-gray-500">Sin tarjetas aún.</p>
                  ) : (
                    <div className="space-y-2">
                      {cards.map((c) => (
                        <div key={c.id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{c.name}</span>
                          <span className="text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded-full">
                            {c.total_stamps} sellos
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORIAL DE SELLOS ───────────────────────────────────────── */}
        {tab === 'history' && (
          <div className="space-y-2">
            {history.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-3">📋</p>
                <p className="font-semibold">Sin historial aún</p>
                <p className="text-sm">Los sellos registrados por tus empleados aparecerán aquí.</p>
              </div>
            ) : (
              history.map((h) => (
                <div key={h.id} className="bg-white rounded-2xl p-3 flex items-center gap-3">
                  <span className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                    {h.stamp_number}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {h.card?.customer?.name || 'Cliente'} — {h.card?.loyalty_card?.name || ''}
                    </p>
                    <p className="text-xs text-gray-400">
                      Empleado: {h.employee?.full_name || '—'} ·{' '}
                      {new Date(h.created_at).toLocaleDateString('es', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {/* ── REDES SOCIALES ────────────────────────────────────────── */}
        {tab === 'social' && (
          <form onSubmit={saveSocial} className="bg-white rounded-2xl p-4 space-y-4">
            <p className="font-semibold text-gray-900">Pie de página y redes sociales</p>
            <p className="text-xs text-gray-500">
              Estos datos aparecen en el pie de página de tu wallet y página de inicio.
            </p>

            <Field label="Facebook (URL completa)">
              <div className="flex items-center gap-2 mt-1">
                <span className="text-blue-600">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </span>
                <input className={inp + ' mt-0'} type="url" placeholder="https://facebook.com/tunegocio"
                  value={socialForm.facebook_url}
                  onChange={(e) => setSocialForm({ ...socialForm, facebook_url: e.target.value })} />
              </div>
            </Field>

            <Field label="Instagram (URL completa)">
              <div className="flex items-center gap-2 mt-1">
                <span className="text-pink-500">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </span>
                <input className={inp + ' mt-0'} type="url" placeholder="https://instagram.com/tunegocio"
                  value={socialForm.instagram_url}
                  onChange={(e) => setSocialForm({ ...socialForm, instagram_url: e.target.value })} />
              </div>
            </Field>

            <Field label="Correo electrónico de contacto">
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input className={inp + ' mt-0'} type="email" placeholder="contacto@tunegocio.com"
                  value={socialForm.contact_email}
                  onChange={(e) => setSocialForm({ ...socialForm, contact_email: e.target.value })} />
              </div>
            </Field>

            <Field label="Texto de derechos reservados">
              <input className={inp} placeholder="© 2025 Todos los derechos reservados"
                value={socialForm.footer_text}
                onChange={(e) => setSocialForm({ ...socialForm, footer_text: e.target.value })} />
            </Field>

            {/* previsualización */}
            <div className="rounded-xl bg-gray-900 p-4 text-center space-y-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Vista previa del pie de página</p>
              <div className="flex justify-center gap-5">
                {socialForm.facebook_url && (
                  <span className="text-blue-400">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </span>
                )}
                {socialForm.instagram_url && (
                  <span className="text-pink-400">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </span>
                )}
                {socialForm.contact_email && (
                  <span className="text-gray-300">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                {socialForm.footer_text || '© 2025 Todos los derechos reservados'}
              </p>
            </div>

            <button type="submit"
              className="w-full bg-gray-900 text-white font-bold py-2.5 rounded-xl">
              Guardar redes sociales
            </button>
          </form>
        )}

      </main>

      {/* modales */}
      {editingCard && (
        <EditCardModal card={editingCard} onSave={onCardSaved} onClose={() => setEditingCard(null)} />
      )}
      {qrCard && (
        <WelcomeQrModal card={qrCard} onClose={() => setQrCard(null)} />
      )}
    </div>
  );
}
