import { Router } from 'express';
import { supabase } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

const router = Router();

router.use(requireAuth);

// GET /api/businesses/me
// Devuelve el negocio del administrador/empleado autenticado.
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    // El admin necesita conocer SU negocio. Empleados ya traen businessId en el token.
    if (req.user.role === 'admin') {
      const { data: biz, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', req.user.id)
        .maybeSingle();
      if (error) throw error;
      if (!biz) {
        return res.json({ business: null });
      }
      return res.json({ business: biz });
    }

    const { data: biz, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', req.user.businessId)
      .maybeSingle();
    if (error) throw error;
    if (!biz) throw new ApiError(404, 'Negocio no encontrado', 'NOT_FOUND');
    res.json({ business: biz });
  })
);

// POST /api/businesses  (solo admin)
// Crea el negocio del administrador logueado. Un admin tiene UN negocio en el MVP.
router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name, description, logo_url, primary_color, secondary_color } = req.body || {};
    if (!name) throw new ApiError(400, 'El nombre del negocio es requerido', 'VALIDATION');

    const slug = (name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) +
      '-' + Math.random().toString(36).slice(2, 6);

    const { data, error } = await supabase
      .from('businesses')
      .insert({
        owner_id: req.user.id,
        name,
        description,
        logo_url,
        primary_color: primary_color || '#1f2937',
        secondary_color: secondary_color || '#f59e0b',
        slug,
      })
      .select('*')
      .single();
    if (error) throw error;
    res.status(201).json({ business: data });
  })
);

// PATCH /api/businesses/:id  (solo admin del negocio)
router.patch(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    // Whitelist de campos editables (evita que se alteren owner_id, id, etc.)
    const allowed = [
      'name',
      'description',
      'logo_url',
      'primary_color',
      'secondary_color',
      'facebook_url',
      'instagram_url',
      'contact_email',
      'footer_text',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', req.params.id)
      .eq('owner_id', req.user.id)
      .select('*')
      .single();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'Negocio no encontrado', 'NOT_FOUND');
    res.json({ business: data });
  })
);

export default router;
