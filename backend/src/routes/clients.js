import { Router } from 'express';
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

export default router;
