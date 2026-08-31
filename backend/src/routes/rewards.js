import { Router } from 'express';
import { supabase } from '../config/db.js';
import { requireAuth, requireEmployee } from '../middleware/auth.js';
import { ApiError, asyncHandler } from '../utils/errors.js';

const router = Router();

router.use(requireAuth, requireEmployee);

// POST /api/rewards/redeem
// El empleado canjea la recompensa de la tarjeta del cliente.
// La tarjeta debe estar completa; una vez canjeada no puede volver a usarse.
router.post(
  '/redeem',
  asyncHandler(async (req, res) => {
    const { token } = req.body || {};
    if (!token) throw new ApiError(400, 'token es requerido', 'VALIDATION');

    const { data: card, error: cardErr } = await supabase
      .from('customer_cards')
      .select(`
        id, stamps, status,
        loyalty_card:loyalty_cards(id, name, total_stamps, reward, business_id)
      `)
      .eq('qr_token', token)
      .maybeSingle();
    if (cardErr) throw cardErr;
    if (!card) throw new ApiError(404, 'Tarjeta no encontrada', 'NOT_FOUND');

    // Aislamiento de tenant
    if (card.loyalty_card.business_id !== req.user.businessId) {
      throw new ApiError(403, 'No tienes permiso para acceder a esta tarjeta', 'FORBIDDEN');
    }
    if (card.stamps < card.loyalty_card.total_stamps) {
      throw new ApiError(409, 'La tarjeta aún no está completa', 'NOT_COMPLETE');
    }
    if (card.status === 'reward_claimed') {
      throw new ApiError(409, 'La recompensa ya fue utilizada', 'ALREADY_CLAIMED');
    }

    const { data: reward, error: rErr } = await supabase
      .from('rewards')
      .insert({
        customer_card_id: card.id,
        business_id: card.loyalty_card.business_id,
        employee_id: req.user.employeeId,
        card_name: card.loyalty_card.name,
        reward_desc: card.loyalty_card.reward,
      })
      .select('id, claimed_at')
      .single();

    if (rErr) {
      // Restricción única por tarjeta: evita doble canje concurrente
      if (rErr.code === '23505') {
        throw new ApiError(409, 'La recompensa ya fue utilizada', 'ALREADY_CLAIMED');
      }
      throw rErr;
    }

    await supabase
      .from('customer_cards')
      .update({ status: 'reward_claimed', updated_at: new Date().toISOString() })
      .eq('id', card.id);

    res.status(201).json({
      reward_id: reward.id,
      claimed_at: reward.claimed_at,
      message: 'Recompensa canjeada',
    });
  })
);

export default router;
