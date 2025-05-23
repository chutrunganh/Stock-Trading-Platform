import express from 'express';
import { 
    getPortfolioDetails,
    getPortfolioHoldings,
    getPortfolioTransactions
} from '../controllers/portfolioController.js';
import authMiddleware from '../middlewares/authenticationMiddleware.js';
import { verifyPortfolioOwnership } from '../middlewares/resourceOwnershipMiddleware.js';

const router = express.Router();

// Apply auth middleware and portfolio ownership verification to individual routes
router.get('/details', authMiddleware, verifyPortfolioOwnership(), getPortfolioDetails);
router.get('/holdings', authMiddleware, verifyPortfolioOwnership(), getPortfolioHoldings);
router.get('/transactions', authMiddleware, verifyPortfolioOwnership(), getPortfolioTransactions);

export default router; 