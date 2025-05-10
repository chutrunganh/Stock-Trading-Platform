import express from 'express';
import { startTradingSession, stopTradingSession, getStatus } from '../controllers/tradingSessionController.js';

const router = express.Router();

// Route to start trading session
router.post('/start', startTradingSession);

// Route to stop trading session
router.post('/stop', stopTradingSession);

// Route to get trading session status
router.get('/status', getStatus);

export default router;
