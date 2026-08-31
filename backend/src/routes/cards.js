import { Router } from 'express';
import { supabase } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

const router = Router();

router.use(requireAuth, requireAdmin);

// GET /api/cards   -> tarjetas del negocio del admin
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { data: biz } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', req.user.id)
      .maybeSingle();
    if (!biz) return res.json({ cards: [] });

    const { data, error } = await supabase
      .from('loyalty_cards')
      .select('*')
      .eq('business_id', biz.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ cards: data });
  })
);

// POST /api/cards   -> crea plantilla de tarjeta
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, description, total_stamps, reward, logo_url, primary_color, secondary_color } = req.body || {};
    if (!name || !reward) throw new ApiError(400, 'Nombre y recompensa son requeridos', 'VALIDATION');
    const total = Number(total_stamps);
    if (!total || total < 1) throw new ApiError(400, 'Debes indicar una cantidad de sellos positiva', 'VALIDATION');

    const { data: biz } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', req.user.id)
      .maybeSingle();
    if (!biz) throw new ApiError(404, 'Primero crea tu negocio', 'NO_BUSINESS');

    const { data, error } = await supabase
      .from('loyalty_cards')
      .insert({
        business_id: biz.id,
        name,
        description,
        total_stamps: total,
        reward,
        logo_url,
        primary_color: primary_color || '#1f2937',
        secondary_color: secondary_color || '#f59e0b',
      })
      .select('*')
      .single();
    if (error) throw error;
    res.status(201).json({ card: data });
  })
);

// PATCH /api/cards/:id
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { data: biz } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', req.user.id)
      .maybeSingle();
    if (!biz) throw new ApiError(404, 'Negocio no encontrado', 'NOT_FOUND');

    const patch = { ...req.body };
    if (patch.total_stamps !== undefined) {
      const total = Number(patch.total_stamps);
      if (!total || total < 1) throw new ApiError(400, 'Cantidad de sellos inválida', 'VALIDATION');
      patch.total_stamps = total;
    }
    delete patch.business_id;

    const { data, error } = await supabase
      .from('loyalty_cards')
      .update(patch)
      .eq('id', req.params.id)
      .eq('business_id', biz.id)
      .select('*')
      .single();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'Tarjeta no encontrada', 'NOT_FOUND');
    res.json({ card: data });
  })
);

// DELETE /api/cards/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { data: biz } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', req.user.id)
      .maybeSingle();
    if (!biz) throw new ApiError(404, 'Negocio no encontrado', 'NOT_FOUND');

    const { data, error } = await supabase
      .from('loyalty_cards')
      .delete()
      .eq('id', req.params.id)
      .eq('business_id', biz.id)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new ApiError(404, 'Tarjeta no encontrada', 'NOT_FOUND');
    res.json({ deleted: true });
  })
);

export default router;
