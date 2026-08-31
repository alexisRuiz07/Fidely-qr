import { Router } from 'express';
import { supabase } from '../config/db.js';
import { requireAuth, requireEmployee } from '../middleware/auth.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

const router = Router();

// ---------- Helpers de seguridad (aislamiento por tenant) ----------

async function resolveCardByToken(qrToken) {
  const { data, error } = await supabase
    .from('customer_cards')
    .select(`
      id, stamps, status, qr_token,
      customer:customers(id, name, email, phone),
      loyalty_card:loyalty_cards(id, name, total_stamps, reward, business_id, logo_url, primary_color, secondary_color)
    `)
    .eq('qr_token', qrToken)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ---------- Endpoints ----------

router.use(requireAuth, requireEmployee);

// POST /api/stamps/validate
// El empleado escanea el QR (token) y obtiene el contexto para registrar sellos.
// Valida en backend: token -> tarjeta -> negocio del empleado == negocio de la tarjeta.
router.post(
  '/validate',
  asyncHandler(async (req, res) => {
    const { token } = req.body || {};
    if (!token) throw new ApiError(400, 'token es requerido', 'VALIDATION');

    const card = await resolveCardByToken(token);
    if (!card) throw new ApiError(404, 'Tarjeta no encontrada', 'NOT_FOUND');

    // Aislamiento de tenant: la tarjeta debe pertenecer al negocio del empleado
    if (card.loyalty_card.business_id !== req.user.businessId) {
      throw new ApiError(403, 'No tienes permiso para acceder a esta tarjeta', 'FORBIDDEN');
    }

    const total = card.loyalty_card.total_stamps;
    res.json({
      customer: card.customer,
      card: {
        id: card.id,
        name: card.loyalty_card.name,
        stamps: card.stamps,
        total_stamps: total,
        reward: card.loyalty_card.reward,
        completed: card.stamps >= total,
        status: card.status,
      },
    });
  })
);

// POST /api/stamps
// El empleado registra UN sello. Idempotente ante reintentos (anti-duplicados).
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { token } = req.body || {};
    if (!token) throw new ApiError(400, 'token es requerido', 'VALIDATION');

    const card = await resolveCardByToken(token);
    if (!card) throw new ApiError(404, 'Tarjeta no encontrada', 'NOT_FOUND');
    if (card.loyalty_card.business_id !== req.user.businessId) {
      throw new ApiError(403, 'No tienes permiso para acceder a esta tarjeta', 'FORBIDDEN');
    }
    if (card.status === 'reward_claimed') {
      throw new ApiError(409, 'La recompensa ya fue canjeada en esta tarjeta', 'ALREADY_CLAIMED');
    }

    const total = card.loyalty_card.total_stamps;
    const nextStamp = card.stamps + 1;
    if (nextStamp > total) {
      throw new ApiError(409, 'La tarjeta ya está completa', 'CARD_FULL');
    }

    // TRANSACCIÓN via RPC o secuencia. Aquí: insertar sello + actualizar tarjeta.
    // La restricción única (customer_card_id, stamp_number) evita duplicados.
    const { data: tx, error: txErr } = await supabase
      .from('stamp_transactions')
      .insert({
        customer_card_id: card.id,
        business_id: card.loyalty_card.business_id,
        employee_id: req.user.employeeId,
        stamp_number: nextStamp,
      })
      .select('id')
      .single();

    if (txErr) {
      if (txErr.code === '23505') {
        throw new ApiError(409, 'Sello ya registrado (operación duplicada)', 'DUPLICATE_STAMP');
      }
      throw txErr;
    }

    const newStatus = nextStamp >= total ? 'completed' : 'active';
    await supabase
      .from('customer_cards')
      .update({ stamps: nextStamp, status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', card.id);

    res.status(201).json({
      tx_id: tx.id,
      stamps: nextStamp,
      total_stamps: total,
      completed: nextStamp >= total,
      status: newStatus,
      reward: card.loyalty_card.reward,
    });
  })
);

// GET /api/stamps/history/:customerCardId
// Historial de sellos de una tarjeta (solo dentro del negocio del empleado).
router.get(
  '/history/:customerCardId',
  asyncHandler(async (req, res) => {
    const { data: cc } = await supabase
      .from('customer_cards')
      .select('id, loyalty_card:loyalty_cards(business_id)')
      .eq('id', req.params.customerCardId)
      .maybeSingle();
    if (!cc) throw new ApiError(404, 'Tarjeta no encontrada', 'NOT_FOUND');
    if (cc.loyalty_card.business_id !== req.user.businessId) {
      throw new ApiError(403, 'Acceso denegado', 'FORBIDDEN');
    }

    const { data, error } = await supabase
      .from('stamp_transactions')
      .select('id, stamp_number, created_at, employee:employees(full_name)')
      .eq('customer_card_id', req.params.customerCardId)
      .order('stamp_number', { ascending: true });
    if (error) throw error;
    res.json({ history: data });
  })
);

export default router;
