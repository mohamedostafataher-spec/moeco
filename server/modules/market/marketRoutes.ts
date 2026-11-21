
import express from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../../services/supabaseClient.ts';

const router = express.Router();

/**
 * @route GET /api/market
 * @desc Get eco market products.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    let query = supabase.from('eco_market').select('*');
    if (category) {
      query = query.eq('category', category);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Market fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch market products' });
  }
});

/**
 * @route POST /api/market/purchase
 * @desc Purchase a product using points or coins.
 */
router.post('/purchase', async (req: Request, res: Response) => {
  try {
    const { userId, productId, paymentMethod } = req.body;
    if (!userId || !productId || !paymentMethod) {
      return res.status(400).json({ error: 'User ID, product ID, and payment method are required' });
    }

    // 1. Fetch product details
    const { data: product, error: productError } = await supabase
      .from('eco_market')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (productError) throw productError;

    // 2. Check user balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('points, green_coins')
      .eq('id', userId)
      .single();
    
    if (userError) throw userError;

    if (paymentMethod === 'Points') {
      if (user.points < product.points_cost) {
        return res.status(400).json({ error: 'Insufficient points' });
      }
      // Deduct points
      const { error: deductError } = await supabase.rpc('decrement_points', { user_id: userId, amount: product.points_cost });
      if (deductError) throw deductError;
    } else if (paymentMethod === 'Coins') {
      // (Simplified: using points for now)
      if (user.green_coins < product.points_cost / 2) { // Rough conversion
        return res.status(400).json({ error: 'Insufficient green coins' });
      }
      const { error: deductError } = await supabase.rpc('decrement_green_coins', { user_id: userId, amount: product.points_cost / 2 });
      if (deductError) throw deductError;
    }

    // 3. Log purchase (In a real app, we'd have a purchases table)

    res.json({
      message: 'Purchase successful',
      product,
      paymentMethod
    });
  } catch (error) {
    console.error('Market purchase error:', error);
    res.status(500).json({ error: 'Failed to complete purchase' });
  }
});

export default router;
