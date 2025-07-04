/**
 * @description This file contains the controller to verify the payment and update the user's portfolio balance.
 * This is a controller to handle the payment verification via Seapay payment gateway and update the user's balance.
 * 
 */

import { verifyPayment} from '../services/paymentService.js';
import log from '../utils/loggerUtil.js';
import pool from '../config/dbConnect.js';

// Verify payment and update user's balance
export const verifyPaymentController = async (req, res, _next) => {
    const { referenceNumber } = req.body;
    const portfolioId = req.user.portfolio_id;

    // Debug logging
    // log.info('Payment verification request:', {
    //     user: req.user,
    //     referenceNumber,
    //     portfolioId
    // });

    // Check if user has a portfolio in the database
    try {
        const portfolioResult = await pool.query(
            'SELECT portfolio_id FROM portfolios WHERE user_id = $1',
            [req.user.id]
        );

        if (!portfolioResult.rows[0]) {
            return res.status(400).json({
                success: false,
                message: 'User does not have a portfolio. Please contact support.',
                error: 'No portfolio found for user'
            });
        }

        // If portfolio exists in database but not in user object, use the one from database
        const actualPortfolioId = portfolioId || portfolioResult.rows[0].portfolio_id;

        const result = await verifyPayment(referenceNumber, actualPortfolioId);
        res.json({
            success: true,
            message: 'Payment verified and balance updated successfully',
            data: result
        });
    } catch (error) {
        log.error('Payment verification error:', error);
        // Custom user-friendly error messages
        let userMessage = 'An error occurred during payment verification. Please try again.';
        if (error.message === 'No transaction found with this reference number' || error.message === 'No incoming payment found with this reference number') {
            userMessage = 'Transaction not found or expired. Please check your reference number and try again.';
        } else if (error.message === 'This payment has already been processed') {
            userMessage = 'This payment has already been processed. Please use a new transaction.';
        }
        res.status(400).json({
            success: false,
            message: userMessage,
            error: error.message
        });
    }
};

