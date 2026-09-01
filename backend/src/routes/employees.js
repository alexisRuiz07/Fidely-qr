import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

const router = Router();

router.use(requireAuth, requireAdmin);

// GET /api/employees   -> lista empleados del negocio del admin
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { data: biz } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', req.user.id)
      .maybeSingle();
    if (!biz) return res.json({ employees: [] });

    const { data, error } = await supabase
      .from('employees')
      .select('id, email, full_name, is_active, branch, created_at')
      .eq('business_id', biz.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ employees: data });
  })
);

// POST /api/employees   -> crea empleado del negocio del admin
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { email, password, full_name } = req.body || {};
    if (!email || !password) throw new ApiError(400, 'Email y password requeridos', 'VALIDATION');

    const { data: biz } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', req.user.id)
      .maybeSingle();
    if (!biz) throw new ApiError(404, 'Primero crea tu negocio', 'NO_BUSINESS');

    const passwordHash = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('employees')
      .insert({ business_id: biz.id, email, password_hash: passwordHash, full_name, branch: req.body.branch || null })
      .select('id, email, full_name, is_active, branch, created_at')
      .single();

    if (error) {
      if (error.code === '23505') throw new ApiError(409, 'Email de empleado ya en uso', 'EMAIL_TAKEN');
      throw error;
    }
    res.status(201).json({ employee: data });
  })
);

// PATCH /api/employees/:id   -> actualiza/toggle activo (siempre dentro del negocio del admin)
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { data: biz } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', req.user.id)
      .maybeSingle();
    if (!biz) throw new ApiError(404, 'Negocio no encontrado', 'NOT_FOUND');

    const patch = {};
    if (req.body.full_name !== undefined) patch.full_name = req.body.full_name;
    if (req.body.password) patch.password_hash = await bcrypt.hash(req.body.password, 10);
    if (req.body.is_active !== undefined) patch.is_active = Boolean(req.body.is_active);
    if (req.body.branch !== undefined) patch.branch = req.body.branch || null;

    const { data, error } = await supabase
      .from('employees')
      .update(patch)
      .eq('id', req.params.id)
      .eq('business_id', biz.id)
      .select('id, email, full_name, is_active, branch, created_at')
      .single();
    if (error) throw error;
    if (!data) throw new ApiError(404, 'Empleado no encontrado', 'NOT_FOUND');
    res.json({ employee: data });
  })
);

// DELETE /api/employees/:id
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
      .from('employees')
      .delete()
      .eq('id', req.params.id)
      .eq('business_id', biz.id)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new ApiError(404, 'Empleado no encontrado', 'NOT_FOUND');
    res.json({ deleted: true });
  })
);

export default router;
