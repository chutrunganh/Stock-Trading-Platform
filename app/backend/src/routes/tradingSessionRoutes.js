import express from 'express';
import { startTradingSession, stopTradingSession, getStatus } from '../controllers/tradingSessionController.js';
import authMiddleware from '../middlewares/authenticationMiddleware.js';
import { requireTradingSessionControl } from '../middlewares/roleBasedAccessControlMiddleware.js';

const router = express.Router();

// Public route - no authentication required
router.get('/status', getStatus);

// Protected routes - require admin role and trading session control permission
router.post('/start', authMiddleware, requireTradingSessionControl, startTradingSession);
router.post('/stop', authMiddleware, requireTradingSessionControl, stopTradingSession);

export default router;
