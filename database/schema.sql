-- ============================================================
-- PLATAFORMA DE TARJETAS DE FIDELIZACIÓN DIGITALES
-- Esquema multi-tenant preparado para integrar Apple/Google Wallet
-- posteriormente sin rehacer el sistema.
--
-- Cómo usar en Supabase:
--   1. Abre el SQL Editor de tu proyecto Supabase.
--   2. Pega este archivo completo y ejecútalo.
--   3. Verifica que RLS esté habilitado en las tablas clave.
-- ============================================================

-- Extensión para generar UUIDs
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- CUENTAS DE ADMINISTRADOR (acceden al panel de negocio)
-- ------------------------------------------------------------
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text unique not null,
  password_hash text not null,
  full_name     text,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- NEGOCIOS (cada negocio es un "tenant")
-- ------------------------------------------------------------
create table if not exists businesses (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references users(id) on delete cascade,
  name       text not null,
  slug       text unique,
  description text,
  logo_url   text,
  -- Colores personalizados por defecto para sus tarjetas
  primary_color text default '#1f2937',
  secondary_color text default '#f59e0b',
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- EMPLEADOS (pertenecen a un negocio, pueden registrar sellos/canjes)
-- ------------------------------------------------------------
create table if not exists employees (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references businesses(id) on delete cascade,
  email          text unique not null,
  password_hash  text not null,
  full_name      text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ------------------------------------------------------------
-- CLIENTES (pueden ser anónimos, creados desde QR de bienvenida)
-- ------------------------------------------------------------
create table if not exists customers (
  id           uuid primary key default gen_random_uuid(),
  -- Identificador anónimo opcional generado por el navegador/sesión
  device_id    text,
  name         text default 'Cliente',
  email        text,
  phone        text,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PLANTILLA DE TARJETA DE FIDELIZACIÓN (definida por el negocio)
-- ------------------------------------------------------------
create table if not exists loyalty_cards (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  name            text not null,
  description     text,
  total_stamps    integer not null default 8 check (total_stamps > 0),
  reward          text not null,              -- descripción de la recompensa
  logo_url        text,
  primary_color   text default '#1f2937',
  secondary_color text default '#f59e0b',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ------------------------------------------------------------
-- INSTANCIA DE TARJETA (una tarjeta de planta asignada a un cliente)
-- ------------------------------------------------------------
create table if not exists customer_cards (
  id              uuid primary key default gen_random_uuid(),
  loyalty_card_id uuid not null references loyalty_cards(id) on delete cascade,
  customer_id     uuid not null references customers(id) on delete cascade,
  stamps          integer not null default 0 check (stamps >= 0),
  status          text not null default 'active'
                  check (status in ('active','completed','reward_claimed')),
  -- Token seguro y único que va dentro del QR (NO datos sensibles)
  qr_token        uuid unique not null default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ------------------------------------------------------------
-- HISTORIAL DE SELLOS (cada sello es inmutable, auditado)
-- ------------------------------------------------------------
create table if not exists stamp_transactions (
  id               uuid primary key default gen_random_uuid(),
  customer_card_id uuid not null references customer_cards(id) on delete cascade,
  business_id      uuid not null references businesses(id) on delete cascade,
  employee_id      uuid references employees(id) on delete set null,
  stamp_number     integer not null,
  created_at       timestamptz not null default now()
);

-- Evita sellos duplicados: una tarjeta no puede tener el mismo número de sello dos veces
create unique index if not exists uniq_stamp_number
  on stamp_transactions (customer_card_id, stamp_number);

-- ------------------------------------------------------------
-- RECOMPENSAS CANJEADAS (una recompensa solo puede usarse una vez)
-- ------------------------------------------------------------
create table if not exists rewards (
  id               uuid primary key default gen_random_uuid(),
  customer_card_id uuid not null references customer_cards(id) on delete cascade,
  business_id      uuid not null references businesses(id) on delete cascade,
  employee_id      uuid references employees(id) on delete set null,
  card_name        text not null,          -- snapshot del nombre al canjear
  reward_desc      text not null,          -- snapshot de la recompensa
  claimed_at       timestamptz not null default now()
);

create unique index if not exists uniq_reward_per_card
  on rewards (customer_card_id);

-- ------------------------------------------------------------
-- WALLET (interfaz preparada para Apple/Google Wallet)
-- La "wallet_cards" es el vínculo genérico que en el futuro
-- podrá registrar un pass_id de Google/Apple sin tocar el resto.
-- ------------------------------------------------------------
create table if not exists wallet_cards (
  id               uuid primary key default gen_random_uuid(),
  customer_card_id uuid not null references customer_cards(id) on delete cascade,
  customer_id      uuid not null references customers(id) on delete cascade,
  -- channel: 'app' | 'google_wallet' | 'apple_wallet' (preparado)
  channel          text not null default 'app'
                   check (channel in ('app','google_wallet','apple_wallet')),
  external_pass_id text,                    -- id de pass en Google/Apple (futuro)
  added_at         timestamptz not null default now()
);

create index if not exists idx_wallet_customer on wallet_cards (customer_id);
create index if not exists idx_customer_cards_customer on customer_cards (customer_id);
create index if not exists idx_stamps_card on stamp_transactions (customer_card_id);
create index if not exists idx_cards_business on loyalty_cards (business_id);
create index if not exists idx_employees_business on employees (business_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Cada negocio solo puede ver sus propios datos.
-- ------------------------------------------------------------
-- Nota: el backend usará la SERVICE_ROLE_KEY de Supabase, que ignora RLS.
-- Estas políticas quedan como capa defensiva si usas anon key.
-- ============================================================

alter table businesses        enable row level security;
alter table employees         enable row level security;
alter table loyalty_cards     enable row level security;
alter table customer_cards    enable row level security;
alter table stamp_transactions enable row level security;
alter table rewards           enable row level security;
alter table customers         enable row level security;
alter table wallet_cards      enable row level security;

-- ------------------------------------------------------------
-- COLUMNAS DE PIE DE PÁGINA / REDES SOCIALES (por negocio)
-- Ejecuta este bloque si ya tienes la tabla businesses creada.
-- ------------------------------------------------------------
alter table businesses add column if not exists facebook_url   text;
alter table businesses add column if not exists instagram_url  text;
alter table businesses add column if not exists contact_email  text;
alter table businesses add column if not exists footer_text   text default '© 2025 Todos los derechos reservados';

-- ============================================================
-- SELLOS ATÓMICOS (RPC): inserta el sello y actualiza el contador
-- de la tarjeta en UNA sola transacción. Evita sellos perdidos
-- si fallara una de las dos operaciones por separado.
-- Lanza error 23505 (duplicate key) si el sello ya fue registrado.
-- ============================================================
create or replace function record_stamp(
  p_customer_card_id uuid,
  p_business_id      uuid,
  p_employee_id      uuid,
  p_next_stamp       integer
) returns json
language plpgsql
as $$
declare
  v_tx_id    uuid;
  v_total    integer;
  v_status   text;
begin
  insert into stamp_transactions (customer_card_id, business_id, employee_id, stamp_number)
  values (p_customer_card_id, p_business_id, p_employee_id, p_next_stamp)
  returning id into v_tx_id;

  select lc.total_stamps into v_total
  from loyalty_cards lc
  join customer_cards cc on cc.loyalty_card_id = lc.id
  where cc.id = p_customer_card_id;

  v_status := case when p_next_stamp >= v_total then 'completed' else 'active' end;

  update customer_cards
  set stamps = p_next_stamp,
      status = v_status,
      updated_at = now()
  where id = p_customer_card_id;

  return json_build_object(
    'tx_id', v_tx_id,
    'stamps', p_next_stamp,
    'status', v_status,
    'total_stamps', v_total
  );
end;
$$;

grant execute on function record_stamp(uuid, uuid, uuid, integer) to service_role;
