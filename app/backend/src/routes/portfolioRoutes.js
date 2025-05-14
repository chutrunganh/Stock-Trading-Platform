import express from 'express';
import { 
    getPortfolioDetails,
    getPortfolioHoldings,
    getPortfolioTransactions
} from '../controllers/portfolioController.js';
import authMiddleware from '../middlewares/authenticationMiddleware.js';

const router = express.Router();

// Apply auth middleware to individual routes instead of globally
router.get('/details', authMiddleware, getPortfolioDetails);
router.get('/holdings', authMiddleware, getPortfolioHoldings);
router.get('/transactions', authMiddleware, getPortfolioTransactions);

export default router; 