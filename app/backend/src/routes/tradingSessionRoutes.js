import express from 'express';
import { startTradingSession, stopTradingSession, getStatus } from '../controllers/tradingSessionController.js';
import authMiddleware from '../middlewares/authenticationMiddleware.js';
import authorizeRole from '../middlewares/roleBasedAccessControlMiddleware.js';

const router = express.Router();

// Public route - no authentication required
router.get('/status', getStatus);

// Protected routes - require admin role
router.post('/start', authMiddleware, authorizeRole('admin'), startTradingSession);
router.post('/stop', authMiddleware, authorizeRole('admin'), stopTradingSession);

export default router;
