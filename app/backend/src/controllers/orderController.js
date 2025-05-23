/**
 * @file orderController.js
 * @description This file contains the function for frontend to call the order CRUD service.
 */
import { 
    createOrderService,
    createArtificialOrderService, 
    getOrderByIdService, 
    cancelOrderService
} from '../services/orderCRUDService.js';
import { emitOrderBookUpdate } from './orderBookController.js';

const handleResponse = (res, status, message, data = null) => {
    return res.status(status).json({
        status,
        message,
        data,
    });
};

// Controller to create a new order
export const createOrder = async (req, res, next) => {
    // Extract userId from JWT token instead of request body for security (IDOR prevention)
    const userId = req.user.id;
    const { stockId, quantity, price, orderType } = req.body;
    try {
        const newOrder = await createOrderService({ userId, stockId, quantity, price, orderType });
        handleResponse(res, 201, 'Order created successfully', newOrder);
        await emitOrderBookUpdate();
    } catch (error) {
        next(error);
    }
};
//artificial order
export const createArtificialOrder = async (req, res, next) => {
    const { stockId, quantity, price, orderType } = req.body;
    try {
        const artificialOrder = await createArtificialOrderService({ stockId, quantity, price, orderType });
        res.status(201).json({
            status: 201,
            message: 'Artificial order created by admin successfully',
            data: artificialOrder,
        });
        await emitOrderBookUpdate();
    } catch (error) {
        next(error);
    }
};

// Controller to get an order by ID
export const getOrderById = async (req, res, next) => {
    const { orderId } = req.params;
    try {
        const order = await getOrderByIdService(orderId);
        if (!order) {
            return handleResponse(res, 404, 'Order not found');
        }
        handleResponse(res, 200, 'Order retrieved successfully', order);
    } catch (error) {
        next(error);
    }
};

// Cancel an order by ID
export const cancelOrder = async (req, res, next) => {
    const { orderId } = req.params;
    // Extract requesting user ID from JWT token for ownership verification (IDOR prevention)
    const requestingUserId = req.user.id;
    
    try {
        const order = await cancelOrderService(orderId, requestingUserId);
        handleResponse(res, 200, 'Order cancelled successfully', order);
        await emitOrderBookUpdate();
    } catch (error) {
        // Handle specific error cases for better user experience
        if (error.message === 'Order not found') {
            return handleResponse(res, 404, 'Order not found');
        } else if (error.message === 'Unauthorized: You can only cancel your own orders') {
            return handleResponse(res, 403, 'Forbidden: You can only cancel your own orders');
        }
        next(error);
    }
};