import express from 'express';
import { createOrder, cancelOrder, getOrderById, getUserOrders } from '../controllers/orderController.js';
import { getOrderBook, orderBookSSE } from '../controllers/orderBookController.js';
import authMiddleware from '../middlewares/authenticationMiddleware.js';
import isTradingSessionMiddleware from '../middlewares/tradingSessionMiddleware.js';
import { validateOrder } from '../middlewares/orderMiddleware.js';
import { verifyOrderOwnership} from '../middlewares/resourceOwnershipMiddleware.js';

const router = express.Router();

// Create order - any authenticated user can create orders for their own portfolio
router.post('/createOrder', 
    authMiddleware,
    isTradingSessionMiddleware,
    validateOrder,
    createOrder
);

// Public routes - anyone can view order book
router.get('/orderBook', getOrderBook);
router.get('/orderBook/stream', orderBookSSE);

// Get all orders for authenticated user - no ownership verification needed since it's user's own orders
router.get('/user', 
    authMiddleware,
    getUserOrders
);

// Get order by ID - authenticated users can only access their own orders
router.get('/:orderId', 
    authMiddleware,
    verifyOrderOwnership('orderId'), // Verify order ownership before allowing access
    getOrderById
);

// Cancel order - authenticated users can cancel their own orders
router.delete('/cancelOrder/:orderId', 
    authMiddleware,
    verifyOrderOwnership('orderId'), // Verify order ownership before canceling
    cancelOrder
);

export default router;