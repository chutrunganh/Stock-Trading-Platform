import express from 'express';
import { createOrder, cancelOrder } from '../controllers/orderController.js';

const router = express.Router();

// Route to create a new order
router.post('/createOrder', createOrder);

// Route to cacel a specific order by ID
router.delete('/cancelOrder/:orderId', cancelOrder);

export default router;