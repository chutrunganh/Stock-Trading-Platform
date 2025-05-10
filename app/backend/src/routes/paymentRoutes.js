import express from 'express';
import { verifyPaymentController} from '../controllers/paymentControllers.js';
import authMiddleware from '../middlewares/authenticationMiddleware.js';

const router = express.Router();

// Payment verification endpoint
router.post('/verify', authMiddleware, verifyPaymentController);

export default router; 