import { Router } from 'express';
import { supabase } from '../config/db.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

const router = Router();

// POST /api/public/welcome
// Body: { loyalty_card_id, device_id?, name? }
// Crea (o reutiliza) un cliente mediante el ID de la tarjeta y le asigna la instancia.
// Este proceso genera la "customer_card" con su token QR, SIN obligar a crear cuenta.
router.post(
  '/welcome',
  asyncHandler(async (req, res) => {
    const { loyalty_card_id, device_id, name } = req.body || {};
    if (!loyalty_card_id) throw new ApiError(400, 'loyalty_card_id es requerido', 'VALIDATION');

    const { data: card, error: cardErr } = await supabase
      .from('loyalty_cards')
      .select('id, business_id, name, total_stamps, is_active')
      .eq('id', loyalty_card_id)
      .eq('is_active', true)
      .maybeSingle();
    if (cardErr) throw cardErr;
    if (!card) throw new ApiError(404, 'Tarjeta no encontrada o inactiva', 'NOT_FOUND');

    // Buscar/reusar cliente anónimo por dispositivo
    let customerId = null;
    if (device_id) {
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('device_id', device_id)
        .limit(1)
        .maybeSingle();
      if (existing) customerId = existing.id;
    }

    if (!customerId) {
      const { data: cust, error: custErr } = await supabase
        .from('customers')
        .insert({ device_id, name: name || 'Cliente' })
        .select('id')
        .single();
      if (custErr) throw custErr;
      customerId = cust.id;
    }

    // Evitar tarjetas duplicadas del mismo cliente para la misma planta
    const { data: dup } = await supabase
      .from('customer_cards')
      .select('id')
      .eq('loyalty_card_id', loyalty_card_id)
      .eq('customer_id', customerId)
      .maybeSingle();
    if (dup) {
      throw new ApiError(409, 'Ya tienes esta tarjeta en tu wallet', 'ALREADY_OWNED');
    }

    const { data: cc, error: ccErr } = await supabase
      .from('customer_cards')
      .insert({ loyalty_card_id, customer_id: customerId })
      .select('*')
      .single();
    if (ccErr) throw ccErr;

    const { data: walletErr } = await supabase.from('wallet_cards').insert({
      customer_card_id: cc.id,
      customer_id: customerId,
      channel: 'app',
    });
    // (walletErr) se ignora: el wallet es un vínculo auxiliar.

    res.status(201).json({ customer_card: cc, loyalty_card: card, customer_id: customerId });
  })
);

// GET /api/public/wallet/:deviceId
// Devuelve todas las tarjetas (con su negocio y planta) del cliente anónimo,
// listas para mostrarse en "Mi Wallet". Incluye el token QR de cada tarjeta.
router.get(
  '/wallet/:deviceId',
  asyncHandler(async (req, res) => {
    const { data: cust } = await supabase
      .from('customers')
      .select('id')
      .eq('device_id', req.params.deviceId)
      .maybeSingle();
    if (!cust) return res.json({ wallet: [] });

    const { data: cards, error } = await supabase
      .from('customer_cards')
      .select('id, stamps, status, qr_token, created_at, loyalty_card_id')
      .eq('customer_id', cust.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Cargar planta + negocio de cada tarjeta con consultas por lotes
    const cardIds = cards.map((c) => c.loyalty_card_id);
    const { data: loyaltyCards, error: lErr } = await supabase
      .from('loyalty_cards')
      .select('id, name, description, total_stamps, reward, logo_url, primary_color, secondary_color, business_id')
      .in('id', cardIds.length ? cardIds : ['00000000-0000-0000-0000-000000000000']);
    if (lErr) throw lErr;

    const bizIds = (loyaltyCards || []).map((l) => l.business_id);
    const { data: businesses, error: bErr } = await supabase
      .from('businesses')
      .select('id, name, logo_url, primary_color, secondary_color')
      .in('id', bizIds.length ? bizIds : ['00000000-0000-0000-0000-000000000000']);
    if (bErr) throw bErr;

    const cardMap = Object.fromEntries((loyaltyCards || []).map((l) => [l.id, l]));
    const bizMap = Object.fromEntries((businesses || []).map((b) => [b.id, b]));

    const wallet = cards.map((cc) => ({
      ...cc,
      loyalty_card: cardMap[cc.loyalty_card_id] || null,
      business: cardMap[cc.loyalty_card_id] ? bizMap[cardMap[cc.loyalty_card_id].business_id] : null,
    }));

    res.json({ wallet });
  })
);

// GET /api/public/footer
// Devuelve los datos del footer del negocio (redes, email, copyright).
// Se usa en las páginas públicas (Home, Wallet) sin autenticación.
router.get(
  '/footer',
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('businesses')
      .select('name, facebook_url, instagram_url, contact_email, footer_text')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    res.json({ footer: data || {} });
  })
);

export default router;
