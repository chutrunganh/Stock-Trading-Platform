/**
 * @description This file contains the controller to get 
 * details information (balance, total assets value), holdings and transactions to display on the Portfolio page.
 */

import { 
    getPortfolioByUserIdService,
    getPortfolioHoldingsService,
    getPortfolioTransactionsService
} from '../services/portfolioCRUDService.js';

const handleResponse = (res, status, message, data = null) => {
    return res.status(status).json({
        status,
        message,
        data,
    });
};

// Get portfolio details
export const getPortfolioDetails = async (req, res, next) => {
    try {
        // Extract userId from JWT token instead of accept ID from request body/URL path for security (IDOR prevention)
        const userId = req.user.id; // Assuming user info is attached by auth middleware
        const portfolio = await getPortfolioByUserIdService(userId);
        handleResponse(res, 200, 'Portfolio details retrieved successfully', portfolio);
    } catch (error) {
        next(error);
    }
};

// Get portfolio holdings
export const getPortfolioHoldings = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const holdings = await getPortfolioHoldingsService(userId);
        handleResponse(res, 200, 'Portfolio holdings retrieved successfully', holdings);
    } catch (error) {
        next(error);
    }
};

// Get portfolio transactions
export const getPortfolioTransactions = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const transactions = await getPortfolioTransactionsService(userId);
        handleResponse(res, 200, 'Portfolio transactions retrieved successfully', transactions);
    } catch (error) {
        next(error);
    }
}; 