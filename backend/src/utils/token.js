/**
 * Aplica el filtro de qr_token correcto según el formato que pegó el empleado.
 *
 * Formatos soportados:
 *   - UUID con guiones  "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  → eq directo
 *   - UUID sin guiones  "a1b2c3d4e5f678900abcdef1234567890"      → reformatea y eq
 *   - Código corto      "2D40 B2FA 9748" (últimos 12 hex)        → ilike sufijo
 *
 * En cualquier otro caso devuelve la query filtrada por un UUID imposible
 * (→ maybeSingle() devolverá null → el caller lanza 404).
 */
export function applyTokenFilter(query, rawToken) {
  const clean = (rawToken || '').replace(/[\s-]/g, '').toLowerCase();

  // UUID sin guiones: 32 hex chars
  if (/^[0-9a-f]{32}$/.test(clean)) {
    const uuid = [
      clean.slice(0, 8),
      clean.slice(8, 12),
      clean.slice(12, 16),
      clean.slice(16, 20),
      clean.slice(20),
    ].join('-');
    return query.eq('qr_token', uuid);
  }

  // UUID con guiones: 36 chars con el patrón correcto
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
    (rawToken || '').trim().toLowerCase()
  )) {
    return query.eq('qr_token', rawToken.trim().toLowerCase());
  }

  // Código corto: 8–12 hex chars (sufijo del UUID generado por el frontend)
  if (/^[0-9a-f]{8,12}$/.test(clean)) {
    // qr_token es tipo uuid en Postgres; casteamos a text para poder hacer ILIKE
    return query.filter('qr_token::text', 'ilike', `%${clean}`);
  }

  // Formato no reconocido: forzar que no matchee nada
  return query.eq('qr_token', '00000000-0000-0000-0000-000000000000');
}
