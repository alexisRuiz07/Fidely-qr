import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { supabase } from '../config/db.js';
import { signToken } from '../utils/jwt.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

const router = Router();

// Limitar intentos de login (protección contra fuerza bruta)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // ventana de 15 minutos
  max: 10,                  // máx. 10 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos. Intenta de nuevo en unos minutos.',
    code: 'RATE_LIMITED',
  },
});

// POST /api/auth/register-admin
// Crea una cuenta de administrador (primer paso antes de crear su negocio).
router.post(
  '/register-admin',
  asyncHandler(async (req, res) => {
    const { email, password, full_name } = req.body || {};
    if (!email || !password) {
      throw new ApiError(400, 'Email y password son requeridos', 'VALIDATION');
    }
    if (password.length < 6) {
      throw new ApiError(400, 'La contraseña debe tener al menos 6 caracteres', 'VALIDATION');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert({ email, password_hash: passwordHash, full_name })
      .select('id, email, full_name, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ApiError(409, 'Ya existe una cuenta con ese email', 'EMAIL_TAKEN');
      }
      throw error;
    }

    const token = signToken({ sub: data.id, role: 'admin' });
    res.status(201).json({ token, user: data });
  })
);

// POST /api/auth/login-admin
router.post(
  '/login-admin',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) throw new ApiError(400, 'Credenciales requeridas', 'VALIDATION');

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    if (!user) throw new ApiError(401, 'Credenciales inválidas', 'INVALID_CREDENTIALS');

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new ApiError(401, 'Credenciales inválidas', 'INVALID_CREDENTIALS');

    const token = signToken({ sub: user.id, role: 'admin' });
    res.json({
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name },
    });
  })
);

// POST /api/auth/login-employee
router.post(
  '/login-employee',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) throw new ApiError(400, 'Credenciales requeridas', 'VALIDATION');

    const { data: emp, error } = await supabase
      .from('employees')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    if (!emp || !emp.is_active) throw new ApiError(401, 'Credenciales inválidas', 'INVALID_CREDENTIALS');

    const ok = await bcrypt.compare(password, emp.password_hash);
    if (!ok) throw new ApiError(401, 'Credenciales inválidas', 'INVALID_CREDENTIALS');

    const token = signToken({
      sub: emp.id,
      role: 'employee',
      businessId: emp.business_id,
      employeeId: emp.id,
    });
    res.json({
      token,
      user: { id: emp.id, full_name: emp.full_name, business_id: emp.business_id },
    });
  })
);

export default router;
