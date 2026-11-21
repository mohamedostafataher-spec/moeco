
import express from 'express';
import type { Request, Response } from 'express';

const router = express.Router();

/**
 * @route GET /api/food/analyze/:barcode
 * @desc Analyze a food product using Open Food Facts.
 */
router.get('/analyze/:barcode', async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    if (!response.ok) throw new Error('Open Food Facts Unavailable');
    
    const data = await response.json();
    if (data.status === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = data.product;
    const ecoScore = product.ecoscore_grade || 'unknown';
    const carbonImpact = product.ecoscore_data?.agribalyse?.ef_total || 0;

    res.json({
      name: product.product_name,
      brand: product.brands,
      image_url: product.image_url,
      eco_score: ecoScore,
      carbon_impact_kg: carbonImpact,
      is_sustainable: ['a', 'b'].includes(ecoScore.toLowerCase())
    });
  } catch (error) {
    console.error('Food analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze food product' });
  }
});

/**
 * @route GET /api/food/search
 * @desc Search for sustainable food products.
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${query}&search_simple=1&action=process&json=1&ecoscore_grade=a`);
    if (!response.ok) throw new Error('Open Food Facts Unavailable');
    
    const data = await response.json();
    res.json(data.products || []);
  } catch (error) {
    console.error('Food search error:', error);
    res.status(500).json({ error: 'Failed to search food products' });
  }
});

export default router;
