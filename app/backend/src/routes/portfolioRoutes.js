import express from 'express';
import { 
    getPortfolioDetails,
    getPortfolioHoldings,
    getPortfolioTransactions
} from '../controllers/portfolioController.js';
import authMiddleware from '../middlewares/authenticationMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get portfolio details
router.get('/details', getPortfolioDetails);

// Get portfolio holdings
router.get('/holdings', getPortfolioHoldings);

// Get portfolio transactions
router.get('/transactions', getPortfolioTransactions);

export default router; 