# Mi Wallet — Tarjetas de Fidelización Digitales

Plataforma web/PWA de tarjetas de fidelización para negocios. Cada negocio crea sus tarjetas y sus clientes las guardan en su **"Mi Wallet"** dentro de la app. Arquitectura preparada para integrar **Apple Wallet** y **Google Wallet** posteriormente (el modelo `wallet_cards` ya contempla el campo `channel`).

## Stack

- **Frontend**: React + Vite + Tailwind CSS (PWA)
- **Backend**: Node.js + Express
- **Base de datos**: PostgreSQL (Supabase)
- **Auth**: JWT propio (roles: admin / employee)
- **QR**: token UUID seguro por tarjeta (sin datos sensibles)

---

## Requisitos

- Node.js 18+
- Una cuenta de [Supabase](https://supabase.com) (plan gratuito suficiente)

---

## 1. Base de datos (Supabase)

1. Crea un proyecto en Supabase.
2. Abre **SQL Editor** → pega el contenido de [`database/schema.sql`](database/schema.sql) → **Run**.
3. Anota estos valores (Dashboard → **Settings → API keys**):
   - `Project URL` → `SUPABASE_URL`
   - `anon public key` → `SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **Seguridad**: la `SERVICE_ROLE_KEY` solo debe usarse en el **backend**, nunca en el frontend, el navegador ni en el repositorio. No la compartas en el chat.

---

## 2. Backend

```bash
cd backend
copy .env.example .env     # Windows  (en Linux/mac: cp .env.example .env)
```

Edita `.env`:

```env
SUPABASE_URL=tu_url
SUPABASE_ANON_KEY=tu_anon
SUPABASE_SERVICE_ROLE_KEY=tu_service_role   # solo backend
JWT_SECRET=genera_un_secreto_largo
FRONTEND_URL=http://localhost:5173
PORT=3000
```

Genera un `JWT_SECRET` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Instala y ejecuta:

```bash
npm install
npm run dev      # o: npm start
```

El backend queda en `http://localhost:3000`.

---

## 3. Frontend

```bash
cd frontend
copy .env.example .env     # Windows  (en Linux/mac: cp .env.example .env)
npm install
npm run dev
```

Abre `http://localhost:5173`.

---

## Flujo de uso (prueba local)

1. **Admin**: `/admin/register` → crea cuenta → en el panel crea tu **negocio**.
2. En el panel crea una **tarjeta de fidelización** (nombre, sellos, recompensa, colores).
3. El panel muestra el **enlace de bienvenida** de esa tarjeta, p. ej. `http://localhost:5173/welcome/<cardId>`.
4. Abre ese enlace (o escanéalo con el QR del material impreso) → la tarjeta se añade a **Mi Wallet**.
5. En **Mi Wallet** (`/wallet`) se ven las tarjetas; al abrir una aparece el **QR** con el token.
6. **Empleado**: `/employee/login` (crea al empleado desde el panel admin) → **Escáner** (`/employee/scan`).
7. Pegando el *token* del QR (o escaneándolo con la cámara) se valida en el backend, se muestra el progreso y se puede **REGISTRAR SELLO**.
8. Al completar la tarjeta aparece **🎉 Recompensa disponible** y el empleado puede **CANJEAR RECOMPENSA** (una sola vez).

---

## Estructura

```
app/
├── backend/
│   └── src/
│       ├── config/db.js          # cliente Supabase (service_role)
│       ├── middleware/auth.js    # requireAuth / requireAdmin / requireEmployee
│       ├── routes/               # auth, businesses, employees, cards, stamps, rewards, clients, public
│       └── utils/                # jwt, errors
├── frontend/
│   └── src/
│       ├── pages/                # Home, Wallet, WatchQr, PrinterWelcome, ScanQr,
│       │                         # EmployeeLogin, AdminLogin/Register/Dashboard
│       ├── components/LoyaltyCard.jsx
│       └── services/api.js
└── database/schema.sql
```

---

## Seguridad implementada

- QR con **token único** (UUID), sin datos sensibles.
- Todas las operaciones importantes se validan en el backend (aislamiento por negocio/tenant).
- Un empleado solo puede operar tarjetas de **su** negocio.
- El cliente **no** puede registrarse sellos (esa acción requiere JWT de empleado).
- Anti-duplicados de sellos: índice único `(customer_card_id, stamp_number)`.
- Recompensa de un solo uso: índice único en `rewards(customer_card_id)` y control de estado.

---

## Notas / pendientes del MVP

- La **cámara real** para escanear el QR ya está integrada (botón **ESCANEAR QR** en el escáner del empleado, usando `html5-qrcode`). También admite pegar el token manualmente.
- La **subida de logo** (para negocio y tarjetas) está implementada: sube la imagen a Supabase Storage (bucket `logos`, creado automáticamente) y guarda la URL. Configura `SUPABASE_STORAGE_BUCKET` en `backend/.env` si quieres otro nombre.
- Los iconos PWA `icon-192.png` / `icon-512.png` son placeholders; reemplázalos con tu logo real.
- Vista de **historial/estadísticas del admin**: las rutas de backend existen (`/api/clients`, `/api/clients/stamps`, `/api/clients/stats`), pero aún no hay pantalla en el frontend.
- **Apple/Google Wallet**: NO implementado (fuera del MVP), pero `wallet_cards.channel` y `external_pass_id` ya están preparados.
- Para usar la cámara en pruebas locales necesitas un contexto seguro (HTTPS) o `localhost` (el navegador exige cámara solo en esos orígenes).
# Fidely-qr
