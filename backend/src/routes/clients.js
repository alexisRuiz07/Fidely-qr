import { Router } from 'express';
import { randomUUID } from 'crypto';
import { supabase } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

const router = Router();

router.use(requireAuth, requireAdmin);

async function getBusinessIdForAdmin(userId) {
  const { data: biz } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();
  return biz?.id || null;
}

// GET /api/clients   -> clientes que tienen tarjetas del negocio del admin
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const bizId = await getBusinessIdForAdmin(req.user.id);
    if (!bizId) return res.json({ clients: [] });

    const { data: cards, error } = await supabase
      .from('customer_cards')
      .select(`
        customer:customers(id, name, email, phone, created_at),
        stamps, status,
        loyalty_card:loyalty_cards(id, name, total_stamps)
      `)
      .eq('loyalty_card.business_id', bizId);

    if (error) throw error;

    // Agrupar por cliente
    const map = new Map();
    for (const c of cards) {
      if (!c.customer) continue;
      const cust = c.customer;
      if (!map.has(cust.id)) {
        map.set(cust.id, { ...cust, cards: [] });
      }
      map.get(cust.id).cards.push({
        card_id: c.loyalty_card?.id,
        card_name: c.loyalty_card?.name,
        stamps: c.stamps,
        total_stamps: c.loyalty_card?.total_stamps,
        status: c.status,
      });
    }
    res.json({ clients: Array.from(map.values()) });
  })
);

// GET /api/clients/stamps   -> historial de todos los sellos del negocio
router.get(
  '/stamps',
  asyncHandler(async (req, res) => {
    const bizId = await getBusinessIdForAdmin(req.user.id);
    if (!bizId) return res.json({ history: [] });

    const { data, error } = await supabase
      .from('stamp_transactions')
      .select(`
        id, stamp_number, created_at,
        employee:employees(full_name),
        card:customer_cards(loyalty_card:loyalty_cards(name), customer:customers(name))
      `)
      .eq('business_id', bizId)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    res.json({ history: data });
  })
);

// GET /api/clients/stats   -> estadísticas básicas del negocio
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const bizId = await getBusinessIdForAdmin(req.user.id);
    if (!bizId) {
      return res.json({ total_clients: 0, total_stamps: 0, total_claims: 0, active_cards: 0 });
    }

    const [{ count: cc }, { count: st }, { count: rw }] = await Promise.all([
      supabase.from('customer_cards').select('id', { count: 'exact', head: true })
        .eq('loyalty_card.business_id', bizId),
      supabase.from('stamp_transactions').select('id', { count: 'exact', head: true })
        .eq('business_id', bizId),
      supabase.from('rewards').select('id', { count: 'exact', head: true })
        .eq('business_id', bizId),
    ]);

    res.json({
      total_cards: cc ?? 0,
      total_stamps: st ?? 0,
      total_claims: rw ?? 0,
      active_cards: cc ?? 0,
    });
  })
);

// POST /api/clients  -> crear cliente manualmente y asignarle una tarjeta
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const bizId = await getBusinessIdForAdmin(req.user.id);
    if (!bizId) throw new ApiError(404, 'Crea tu negocio primero', 'NO_BUSINESS');

    const { name, email, loyalty_card_id } = req.body || {};
    if (!name && !email) throw new ApiError(400, 'Nombre o correo requerido', 'VALIDATION');

    const { data: cust, error: custErr } = await supabase
      .from('customers')
      .insert({ name: name || 'Cliente', email: email || null })
      .select('id, name, email, phone, created_at')
      .single();
    if (custErr) {
      if (custErr.code === '23505') throw new ApiError(409, 'Ya existe un cliente con ese correo', 'EMAIL_TAKEN');
      throw custErr;
    }

    let cardInfo = null;
    if (loyalty_card_id) {
      const { data: lc } = await supabase
        .from('loyalty_cards').select('id')
        .eq('id', loyalty_card_id).eq('business_id', bizId).eq('is_active', true).maybeSingle();
      if (lc) {
        const { data: cc } = await supabase
          .from('customer_cards')
          .insert({ loyalty_card_id, customer_id: cust.id, qr_token: randomUUID() })
          .select('stamps, status').single();
        if (cc) cardInfo = { card_id: loyalty_card_id, stamps: cc.stamps, status: cc.status };
      }
    }

    res.status(201).json({ customer: { ...cust, cards: cardInfo ? [cardInfo] : [] } });
  })
);

// DELETE /api/clients/:id  -> eliminar cliente del negocio
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const bizId = await getBusinessIdForAdmin(req.user.id);
    if (!bizId) throw new ApiError(403, 'Sin negocio', 'FORBIDDEN');

    const { data: exists } = await supabase
      .from('customer_cards').select('id')
      .eq('customer_id', req.params.id)
      .eq('loyalty_card.business_id', bizId)
      .limit(1).maybeSingle();
    if (!exists) throw new ApiError(404, 'Cliente no encontrado en tu negocio', 'NOT_FOUND');

    const { error } = await supabase.from('customers').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ deleted: true });
  })
);

// PATCH /api/clients/:id  -> editar nombre/email de un cliente del negocio
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const bizId = await getBusinessIdForAdmin(req.user.id);
    if (!bizId) throw new ApiError(403, 'Sin negocio', 'FORBIDDEN');

    // Verificar que el cliente pertenece a este negocio
    const { data: exists } = await supabase
      .from('customer_cards')
      .select('id')
      .eq('customer_id', req.params.id)
      .eq('loyalty_card.business_id', bizId)
      .limit(1)
      .maybeSingle();
    if (!exists) throw new ApiError(404, 'Cliente no encontrado', 'NOT_FOUND');

    const { name, email } = req.body || {};
    const updates = {};
    if (name  !== undefined) updates.name  = name;
    if (email !== undefined) updates.email = email;

    const { data: cust, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, name, email, phone, created_at')
      .single();
    if (error) throw error;
    res.json({ customer: cust });
  })
);

export default router;
