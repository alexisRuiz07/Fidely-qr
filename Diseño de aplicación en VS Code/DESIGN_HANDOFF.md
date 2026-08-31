# Fidely QR — Handoff de diseño

Sistema visual: **Organic** (cálido, redondeado). Mockups en `Fidely Mockups.dc.html`.
Stack destino: React + Vite + Tailwind (repo `alexisRuiz07/Fidely-qr`).

## 1. Tokens → `tailwind.config.js`

```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#f5ead8',
        surface: '#ebddc5',
        ink: '#201e1d',
        neutral: { 100:'#f9f4ed',200:'#eee7db',300:'#dcd3c4',400:'#c0b6a5',500:'#a19786',600:'#82796a',700:'#645c50',800:'#474238',900:'#2e2b25' },
        brand:   { DEFAULT:'#c67139',100:'#fff2eb',200:'#ffe1d0',300:'#ffc6a5',400:'#f6a06b',500:'#d67f48',600:'#b2622d',700:'#8c491a',800:'#643312',900:'#402310' },
        sage:    { DEFAULT:'#7a8a5e',100:'#f0fae1',200:'#e1eecc',300:'#ccdbb2',400:'#aebf92',500:'#8fa073',600:'#728157',700:'#56633f',800:'#3d472b',900:'#272e1b' },
      },
      fontFamily: {
        display: ['Caprasimo', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: { sm:'8px', md:'16px', lg:'28px' },
      boxShadow: {
        sm: '0 1px 2px rgba(46,43,37,.14)',
        md: '0 3px 10px rgba(46,43,37,.16)',
        lg: '0 12px 32px rgba(46,43,37,.22)',
      },
      spacing: { 1:'4.4px', 2:'8.8px', 3:'13.2px', 4:'17.6px', 6:'26.4px', 8:'35.2px' },
    },
  },
};
```

Fuentes en `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Caprasimo&family=Figtree:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Iconos: **Lucide** (`npm i lucide-react`), `strokeWidth={2.75}` siempre.

## 2. Reglas del sistema

- Botones y campos: `rounded-full`. Contenedores: `rounded-[28px]`.
- Títulos en Caprasimo (`font-display`), peso 400 — nunca bold.
- Cuerpo en Figtree; texto pequeño en `text-neutral-600/700`.
- Nunca texto de párrafo en `#c67139`: usar `brand-700` sobre fondo claro.
- Foco de teclado: `outline: 2px solid #c67139; outline-offset: 2px`. Nada de anillo azul por defecto.
- Hover del primario: `brand-600`. Deshabilitado: `opacity-45`.
- Formas redondas decorativas (círculos difuminados en las esquinas de las tarjetas) son parte del lenguaje — mantenerlas.

## 3. Mapa pantalla → ruta

| # | Mockup | Ruta | Archivo |
|---|---|---|---|
| 01 | Bienvenida desde QR | `/welcome/:cardId` | `pages/PrinterWelcome.jsx` |
| 02 | Mi Wallet | `/wallet` | `pages/Wallet.jsx` |
| 03 | Detalle + QR | `/card/:cardId` | `pages/WatchQr.jsx` |
| 04 | Recompensa lista | `/card/:cardId` (estado completo) | `pages/WatchQr.jsx` |
| 05 | Perfil / ajustes | `/perfil` *(nueva)* | `pages/Profile.jsx` |
| 06 | Login empleado | `/employee/login` | `pages/EmployeeLogin.jsx` |
| 07 | Escáner QR | `/employee/scan` | `pages/ScanQr.jsx` |
| 08 | Resultado del escaneo | `/employee/scan` (estado resultado) | `pages/ScanQr.jsx` |
| 09 | Panel · resumen | `/admin` | `pages/AdminDashboard.jsx` |
| 10 | Tarjetas · listado + form | `/admin` pestaña Tarjetas | `pages/AdminDashboard.jsx` |
| 11 | Login admin | `/admin/login` | `pages/AdminLogin.jsx` |
| 12 | Registro de negocio | `/admin/register` | `pages/AdminRegister.jsx` |
| 13 | Clientes · tabla + ficha | `/admin` pestaña Clientes | `pages/AdminClients.jsx` *(nueva)* |
| 14 | Empleados · alta | `/admin` pestaña Empleados | `pages/AdminDashboard.jsx` |
| 15 | Negocio · identidad y QR | `/admin` pestaña Negocio | `pages/AdminDashboard.jsx` |
| 16 | Reportes | `/admin/reportes` *(nueva)* | `pages/AdminReports.jsx` *(nueva)* |
| 17 | Centro de notificaciones | overlay en `/admin` | `components/NotificationsPanel.jsx` *(nuevo)* |

El admin es un layout compartido: extrae `AdminLayout` (sidebar 246 px + cabecera) y monta cada pestaña dentro. Las pantallas 13 y 16 necesitan endpoints que ya existen en el backend (`/api/clients`, `/api/clients/stats`).

## 4. Componentes a extraer

- `LoyaltyCard` — reescribir con los tokens; variantes `brand` / `sage` / `neutral` y estado `active | ready | claimed`.
- `StampGrid` — círculos 27/30/38 px según contexto; lleno = fondo `bg` + check `brand-700`; vacío = borde 2px al 35% de opacidad.
- `Pill` (filtros), `StatCard` (admin), `Sheet` (drawer del formulario), `BottomNav` (3 tabs cliente).

## 5. i18n

El diccionario vive en `frontend/src/i18n/index.jsx`. Los mockups están en español; al implementar, añadir la clave EN equivalente para cada string nuevo. Claves nuevas necesarias: `walletSearch`, `filterAll/Active/Claimed`, `rewardReady`, `linkEmail`, `stampRegistered`, `redeemReward`, `newCard`, `stampsNeeded`, `cardColor`, `uploadLogo`.

## 6. Fuera de alcance en estos mockups

Apple/Google Wallet (solo se muestra el estado "Pronto"), tema oscuro, y la vista de detalle de un cliente individual en admin.
