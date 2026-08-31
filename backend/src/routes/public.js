import { Router } from 'express';
import { randomUUID } from 'crypto';
import { supabase } from '../config/db.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

const router = Router();

// GET /api/public/card/:loyaltyCardId
// Información pública de una tarjeta sin crear entrada en wallet.
// Permite que la pantalla de bienvenida muestre el preview antes de añadir.
router.get(
  '/card/:loyaltyCardId',
  asyncHandler(async (req, res) => {
    const { data: card, error } = await supabase
      .from('loyalty_cards')
      .select('id, name, total_stamps, reward, logo_url, primary_color, secondary_color, business_id')
      .eq('id', req.params.loyaltyCardId)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    if (!card) throw new ApiError(404, 'Tarjeta no encontrada o inactiva', 'NOT_FOUND');

    const { data: biz } = await supabase
      .from('businesses')
      .select('id, name, logo_url, primary_color, secondary_color')
      .eq('id', card.business_id)
      .maybeSingle();

    res.json({ loyalty_card: { ...card, business: biz || null } });
  })
);

// POST /api/public/welcome
// Body: { loyalty_card_id, device_id?, name? }
// Crea (o reutiliza) un cliente mediante el ID de la tarjeta y le asigna la instancia.
router.post(
  '/welcome',
  asyncHandler(async (req, res) => {
    const { loyalty_card_id, device_id, name, email } = req.body || {};
    if (!loyalty_card_id) throw new ApiError(400, 'loyalty_card_id es requerido', 'VALIDATION');

    const { data: card, error: cardErr } = await supabase
      .from('loyalty_cards')
      .select('id, business_id, name, total_stamps, reward, logo_url, primary_color, secondary_color, is_active')
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
        .insert({ device_id: device_id || null, name: name || 'Cliente', email: email || null })
        .select('id')
        .single();
      if (custErr) throw custErr;
      customerId = cust.id;
    }
    console.log('[WELCOME] device_id=%s resolvedCustomerId=%s', device_id, customerId);

    // Si hay datos nuevos, actualizar el perfil del cliente existente
    if (name || email) {
      const updates = {};
      if (name)  updates.name  = name;
      if (email) updates.email = email;
      await supabase.from('customers').update(updates).eq('id', customerId);
    }

    // Si ya existe, devolver 200 con already_owned=true (no es un error)
    const { data: dup, error: dupErr } = await supabase
      .from('customer_cards')
      .select('id, stamps, status, qr_token, created_at, loyalty_card_id')
      .eq('loyalty_card_id', loyalty_card_id)
      .eq('customer_id', customerId)
      .maybeSingle();
    console.log('[WELCOME] dupCheckError=%j', dupErr?.message || null);
    console.log('[WELCOME] dupFound=%s customerCardId=%s', !!dup, dup?.id || null);
    if (dup) {
      return res.status(200).json({
        already_owned:  true,
        customer_card:  dup,
        loyalty_card:   card,
        customer_id:    customerId,
      });
    }

    // Generar token QR único
    const qr_token = randomUUID();

    const { data: cc, error: ccErr } = await supabase
      .from('customer_cards')
      .insert({ loyalty_card_id, customer_id: customerId, qr_token })
      .select('*')
      .single();
    if (ccErr) throw ccErr;

    // wallet_cards es un enlace auxiliar (ignoramos error si falla)
    await supabase.from('wallet_cards').insert({
      customer_card_id: cc.id,
      customer_id: customerId,
      channel: 'app',
    });

    res.status(201).json({ customer_card: cc, loyalty_card: card, customer_id: customerId });
  })
);

// GET /api/public/wallet/:deviceId
// Devuelve todas las tarjetas del cliente anónimo listas para "Mi Wallet".
router.get(
  '/wallet/:deviceId',
  asyncHandler(async (req, res) => {
    console.log('[WALLET] deviceId=%s', req.params.deviceId);
    const { data: cust } = await supabase
      .from('customers')
      .select('id')
      .eq('device_id', req.params.deviceId)
      .maybeSingle();
    console.log('[WALLET] resolvedCustomerId=%s', cust?.id || null);
    if (!cust) return res.json({ wallet: [] });

    const { data: cards, error } = await supabase
      .from('customer_cards')
      .select('id, stamps, status, qr_token, created_at, loyalty_card_id')
      .eq('customer_id', cust.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    console.log('[WALLET] cardCountForCustomer=%s', (cards || []).length);

    if (!cards || cards.length === 0) return res.json({ wallet: [] });

    // Cargar planta + negocio en lotes
    const cardIds = cards.map((c) => c.loyalty_card_id);
    const { data: loyaltyCards, error: lErr } = await supabase
      .from('loyalty_cards')
      .select('id, name, description, total_stamps, reward, logo_url, primary_color, secondary_color, business_id')
      .in('id', cardIds);
    if (lErr) throw lErr;

    const bizIds = [...new Set((loyaltyCards || []).map((l) => l.business_id))];
    const { data: businesses, error: bErr } = await supabase
      .from('businesses')
      .select('id, name, logo_url, primary_color, secondary_color')
      .in('id', bizIds.length ? bizIds : ['00000000-0000-0000-0000-000000000000']);
    if (bErr) throw bErr;

    const cardMap = Object.fromEntries((loyaltyCards || []).map((l) => [l.id, l]));
    const bizMap  = Object.fromEntries((businesses  || []).map((b) => [b.id, b]));

    const wallet = cards.map((cc) => ({
      ...cc,
      loyalty_card: cardMap[cc.loyalty_card_id] || null,
      business:     cardMap[cc.loyalty_card_id]
        ? (bizMap[cardMap[cc.loyalty_card_id].business_id] || null)
        : null,
    }));

    res.json({ wallet });
  })
);

// GET /api/public/card/:cardId
// Devuelve la plantilla de una tarjeta activa y su negocio (para el QR de bienvenida).
router.get(
  '/card/:cardId',
  asyncHandler(async (req, res) => {
    const { data: card, error } = await supabase
      .from('loyalty_cards')
      .select('id, business_id, name, description, total_stamps, reward, logo_url, primary_color, secondary_color')
      .eq('id', req.params.cardId)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    if (!card) throw new ApiError(404, 'Tarjeta no encontrada o inactiva', 'NOT_FOUND');

    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, logo_url, primary_color, secondary_color')
      .eq('id', card.business_id)
      .maybeSingle();

    res.json({ card: { ...card, business } });
  })
);

// GET /api/public/footer
// Devuelve los datos del footer (redes, email, copyright) de un negocio.
// Admite ?businessId=<uuid> o ?slug=<slug> para pedir el de un negocio concreto.
// Si no se indica negocio, devuelve el más reciente que tenga datos de footer.
router.get(
  '/footer',
  asyncHandler(async (req, res) => {
    const { businessId, slug } = req.query || {};
    const base = supabase
      .from('businesses')
      .select('name, facebook_url, instagram_url, contact_email, footer_text');

    if (businessId) {
      const { data, error } = await base.eq('id', businessId).maybeSingle();
      if (error) throw error;
      return res.json({ footer: data || {} });
    }

    if (slug) {
      const { data, error } = await base.eq('slug', slug).maybeSingle();
      if (error) throw error;
      return res.json({ footer: data || {} });
    }

    const { data, error } = await base
      .or('facebook_url.not.is.null,instagram_url.not.is.null,contact_email.not.is.null')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    res.json({ footer: data || {} });
  })
);

// ★ TEMPORAL: diagnóstico del bug "already have pero wallet vacío"
router.get('/_debug', asyncHandler(async (req, res) => {
  const { data: customers, error: cErr } = await supabase
    .from('customers').select('id, device_id, name, created_at').order('created_at', { ascending: false }).limit(50);
  if (cErr) throw cErr;
  const { data: cards, error: kErr } = await supabase
    .from('customer_cards').select('id, customer_id, loyalty_card_id, stamps, status, created_at').order('created_at', { ascending: false }).limit(100);
  if (kErr) throw kErr;
  res.json({ customers: customers || [], customerCards: cards || [] });
}));

export default router;