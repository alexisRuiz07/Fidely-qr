// En producción VITE_API_URL="" (cadena vacía) → rutas relativas, Vercel reescribe /api/* al backend.
// En desarrollo sin VITE_API_URL → undefined ?? 'http://localhost:3000' → llama directo al backend local.
const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

function getToken() {
  return localStorage.getItem('token');
}

// Traducción de códigos de error del backend según el idioma.
const ERROR_CODES = {
  VALIDATION: { es: 'Datos inválidos. Revisa los campos.', en: 'Invalid data. Check the fields.' },
  INVALID_CREDENTIALS: { es: 'Credenciales inválidas', en: 'Invalid credentials' },
  EMAIL_TAKEN: { es: 'Ya existe una cuenta con ese email', en: 'An account with that email already exists' },
  FORBIDDEN: { es: 'Acceso denegado', en: 'Access denied' },
  NOT_FOUND: { es: 'No encontrado', en: 'Not found' },
  NO_BUSINESS: { es: 'Primero crea tu negocio', en: 'Create your business first' },
  ALREADY_OWNED: { es: 'Ya tienes esta tarjeta en tu wallet', en: 'You already have this card in your wallet' },
  CARD_FULL: { es: 'La tarjeta ya está completa', en: 'The card is already complete' },
  DUPLICATE_STAMP: { es: 'Sello ya registrado (operación duplicada)', en: 'Stamp already registered (duplicate)' },
  ALREADY_CLAIMED: { es: 'La recompensa ya fue utilizada', en: 'The reward was already used' },
  NOT_COMPLETE: { es: 'La tarjeta aún no está completa', en: 'The card is not complete yet' },
  NOT_IMAGE: { es: 'El archivo debe ser una imagen', en: 'The file must be an image' },
  NO_FILE: { es: 'No se recibió ningún archivo', en: 'No file received' },
};

function lang() {
  try {
    return localStorage.getItem('miwallet_lang') || 'es';
  } catch {
    return 'es';
  }
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API}${path}`, { ...options, headers });
  } catch {
    // Error de red / CORS: el navegador lanza "Failed to fetch".
    const e = new Error('connection');
    e.connection = true;
    throw e;
  }

  let body = null;
  try {
    const isJson = res.headers.get('content-type')?.includes('application/json');
    body = isJson ? await res.json() : null;
  } catch {
    body = null;
  }

  if (!res.ok) {
    // Si conocemos el código, traduce el mensaje; si no, usa el del backend (ya ES/EN según origen).
    const mapped = body?.code ? ERROR_CODES[body.code]?.[lang()] : null;
    const msg = mapped || body?.error || `Error ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.code = body?.code;
    throw err;
  }
  return body;
}

export const api = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data || {}) }),
  patch: (path, data) => request(path, { method: 'PATCH', body: JSON.stringify(data || {}) }),
  del: (path) => request(path, { method: 'DELETE' }),

  // Subida de archivos (logo)
  uploadFile: async (path, file) => {
    const form = new FormData();
    form.append('file', file);
    let res;
    try {
      res = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      });
    } catch {
      const e = new Error('connection');
      e.connection = true;
      throw e;
    }
    let body = null;
    try { body = await res.json(); } catch { body = null; }
    if (!res.ok) {
      const mapped = body?.code ? ERROR_CODES[body.code]?.[lang()] : null;
      const err = new Error(mapped || body?.error || `Error ${res.status}`);
      err.status = res.status;
      err.code = body?.code;
      throw err;
    }
    return body;
  },

  // Auth
  registerAdmin: (d) => request('/api/auth/register-admin', { method: 'POST', body: JSON.stringify(d) }),
  loginAdmin: (d) => request('/api/auth/login-admin', { method: 'POST', body: JSON.stringify(d) }),
  loginEmployee: (d) => request('/api/auth/login-employee', { method: 'POST', body: JSON.stringify(d) }),

  // Público cliente
  welcome: (d) => request('/api/public/welcome', { method: 'POST', body: JSON.stringify(d) }),
  wallet: (deviceId) => request(`/api/public/wallet/${deviceId}`),

  // Empleado
  validateToken: (token) =>
    request('/api/stamps/validate', { method: 'POST', body: JSON.stringify({ token }) }),
  addStamp: (token) =>
    request('/api/stamps', { method: 'POST', body: JSON.stringify({ token }) }),
  redeem: (token) =>
    request('/api/rewards/redeem', { method: 'POST', body: JSON.stringify({ token }) }),

  // Admin — tarjetas
  updateCard: (id, data) => request(`/api/cards/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCard: (id) => request(`/api/cards/${id}`, { method: 'DELETE' }),

  // Admin — empleados
  toggleEmployee: (id, is_active) =>
    request(`/api/employees/${id}`, { method: 'PATCH', body: JSON.stringify({ is_active }) }),
  deleteEmployee: (id) => request(`/api/employees/${id}`, { method: 'DELETE' }),

  // Admin — clientes y estadísticas
  getClients: () => request('/api/clients'),
  getStats: () => request('/api/clients/stats'),
  getStampsHistory: () => request('/api/clients/stamps'),
  updateClient: (id, data) => request(`/api/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  createClient: (data) => request('/api/clients', { method: 'POST', body: JSON.stringify(data) }),
  deleteClient: (id) => request(`/api/clients/${id}`, { method: 'DELETE' }),

  // Público — correo y recuperación
  linkEmail: (deviceId, email) =>
    request('/api/public/link-email', { method: 'POST', body: JSON.stringify({ device_id: deviceId, email }) }),
  recoverWallet: (email, deviceId) =>
    request('/api/public/recover', { method: 'POST', body: JSON.stringify({ email, device_id: deviceId }) }),
};
