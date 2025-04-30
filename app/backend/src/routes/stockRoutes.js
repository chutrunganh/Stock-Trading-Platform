import express from 'express';
import { getStockBySymbolService } from '../services/stockCRUDService.js';

const router = express.Router();

// GET /api/stocks/symbol/:symbol
router.get('/symbol/:symbol', async (req, res) => {
    try {
        const stock = await getStockBySymbolService(req.params.symbol.toUpperCase());
        res.json(stock);
    } catch (error) {
        console.error('Error in get stock by symbol route:', error);
        res.status(404).json({ 
            message: `Stock with symbol ${req.params.symbol} not found`, 
            error: error.message 
        });
    }
});

export default router;
