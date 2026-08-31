import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// El backend usa la SERVICE_ROLE_KEY, que ignora RLS.
// La ANON_KEY NO se usa aquí; se podría usar el anon client para endpoints públicos.
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    'Faltan las credenciales de Supabase. Copia .env.example a .env y completa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.'
  );
}

// Cliente con permisos totales para operaciones de backend.
export const supabase = createClient(url, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
