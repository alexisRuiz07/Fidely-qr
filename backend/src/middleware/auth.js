import { verifyToken } from '../utils/jwt.js';
import { ApiError, asyncHandler } from '../utils/errors.js';
import { supabase } from '../config/db.js';

// Añade req.user según el token. Lanza 401 si es inválido o el usuario no existe.
export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new ApiError(401, 'No autorizado: falta el token', 'NO_TOKEN');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new ApiError(401, 'Token inválido o expirado', 'BAD_TOKEN');
  }

  // Re-verificar contra la BD que la cuenta siga existiendo y activa.
  // Un administrador puede desactivar a un empleado; el token no debe
  // seguir funcionando después de eso (en vez de esperar a que expire).
  if (payload.role === 'employee') {
    const { data: emp } = await supabase
      .from('employees')
      .select('id, is_active')
      .eq('id', payload.sub)
      .maybeSingle();
    if (!emp || !emp.is_active) {
      throw new ApiError(401, 'La sesión ya no está activa', 'BAD_TOKEN');
    }
  } else if (payload.role === 'admin') {
    const { data: usr } = await supabase
      .from('users')
      .select('id')
      .eq('id', payload.sub)
      .maybeSingle();
    if (!usr) {
      throw new ApiError(401, 'La sesión ya no está activa', 'BAD_TOKEN');
    }
  }

  req.user = {
    id: payload.sub,
    role: payload.role,      // 'admin' | 'employee'
    businessId: payload.businessId ?? null,
    employeeId: payload.employeeId ?? null,
  };
  next();
});

// Solo administradores (dueños de negocio)
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return next(new ApiError(403, 'Acceso denegado: requiere rol de administrador', 'FORBIDDEN'));
  }
  next();
};

// Solo empleados
export const requireEmployee = (req, res, next) => {
  if (req.user?.role !== 'employee') {
    return next(new ApiError(403, 'Acceso denegado: requiere rol de empleado', 'FORBIDDEN'));
  }
  next();
};

// Carga el negocio del usuario autenticado. Útil para rutas que operan sobre un tenant.
export const loadBusiness = asyncHandler(async (req, res, next) => {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', req.user.businessId)
    .maybeSingle();
  if (error) return next(error);
  if (!data) throw new ApiError(404, 'Negocio no encontrado', 'NOT_FOUND');
  req.business = data;
  next();
});
