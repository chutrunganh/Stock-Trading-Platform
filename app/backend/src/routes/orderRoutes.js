import express from 'express';
import { createOrder, cancelOrder } from '../controllers/orderController.js';
import { getOrderBook, orderBookSSE } from '../controllers/orderBookController.js';
import authMiddleware from '../middlewares/authenticationMiddleware.js';
import isTradingSessionMiddleware from '../middlewares/tradingSessionMiddleware.js';
import {validateOrder} from '../middlewares/orderMiddleware.js'
const router = express.Router();

// Route to create a new order - applies middleware in sequence
router.post('/createOrder', 
    authMiddleware,
    isTradingSessionMiddleware,
    validateOrder,
    createOrder);

// GET route to fetch the order book data
router.get('/orderBook', getOrderBook);

// SSE endpoint for real-time order book updates
router.get('/orderBook/stream', orderBookSSE);

// Route to cancel a specific order by ID
router.delete('/cancelOrder/:orderId', cancelOrder);

export default router;