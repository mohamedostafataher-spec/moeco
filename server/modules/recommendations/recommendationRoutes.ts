
import express from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../../services/supabaseClient.ts';

const router = express.Router();

/**
 * @route GET /api/recommendations/:userId
 * @desc Get smart recommendations for a user.
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // 1. Fetch user profile and carbon summary
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    const { data: carbonSummary, error: carbonError } = await supabase
      .from('carbon_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(20);
    
    if (profileError || carbonError) throw new Error('Failed to fetch user data');

    // 2. Simple recommendation logic
    const recommendations = [];

    // If transport carbon is high, suggest walking or carpooling
    const transportCarbon = carbonSummary.filter(item => item.source_type === 'Transport').reduce((acc, item) => acc + item.carbon_kg, 0);
    if (transportCarbon > 50) {
      recommendations.push({
        title_ar: 'جرب المشي اليوم',
        title_en: 'Try walking today',
        description_ar: 'لقد سجلت انبعاثات عالية من النقل. المشي لمسافات قصيرة يقلل من بصمتك الكربونية.',
        description_en: 'You have high transport emissions. Walking short distances reduces your carbon footprint.',
        type: 'Transport',
        action_link: '/walking'
      });
    }

    // Suggest sustainable products
    recommendations.push({
      title_ar: 'منتجات مستدامة لك',
      title_en: 'Sustainable products for you',
      description_ar: 'اكتشف منتجات صديقة للبيئة في سوق ايكو.',
      description_en: 'Discover eco-friendly products in the Eco Market.',
      type: 'Market',
      action_link: '/market'
    });

    // Suggest daily missions
    recommendations.push({
      title_ar: 'مهمة يومية جديدة',
      title_en: 'New daily mission',
      description_ar: 'أكمل مهمة اليوم واكسب نقاطاً إضافية.',
      description_en: 'Complete today\'s mission and earn extra points.',
      type: 'Mission',
      action_link: '/missions'
    });

    res.json(recommendations);
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;
