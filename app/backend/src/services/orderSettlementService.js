import pool from '../config/dbConnect.js';
import { updateHoldingService } from './holdingCRUDService.js';
import { updatePortfolioService } from './portfolioCRUDService.js';
import { createTransactionService } from './transactionCRUDService.js';

/**
 * Handles the complete settlement of a matched order, including:
 * 1. Updating holdings for both parties
 * 2. Updating portfolio balances
 * 3. Recording transactions
 */
export const settleMatchedOrder = async (matchedOrder) => {
    const {
        buyerPortfolioId,
        sellerPortfolioId,
        stockId,
        quantity,
        price,
        matchType // 'limit' or 'market'
    } = matchedOrder;

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN'); // Start transaction        // Calculate total transaction value (rounded to 2 decimal places)
        const totalValue = Number((quantity * price).toFixed(2));

        // 1. Update Holdings
        // For buyer: Increase holdings
        await updateHoldingService(buyerPortfolioId, stockId, quantity, price, true, client);
        // For seller: Decrease holdings
        await updateHoldingService(sellerPortfolioId, stockId, quantity, price, false, client);

        // 2. Update Portfolio Balances
        // Deduct money from buyer
        const buyerPortfolio = await client.query('SELECT cash_balance FROM portfolios WHERE portfolio_id = $1', [buyerPortfolioId]);
        const buyerNewBalance = Number((parseFloat(buyerPortfolio.rows[0].cash_balance) - totalValue).toFixed(2));
        await updatePortfolioService(buyerPortfolioId, { cash_balance: buyerNewBalance });        // Add money to seller
        const sellerPortfolio = await client.query('SELECT cash_balance FROM portfolios WHERE portfolio_id = $1', [sellerPortfolioId]);
        const sellerNewBalance = Number((parseFloat(sellerPortfolio.rows[0].cash_balance) + totalValue).toFixed(2));
        await updatePortfolioService(sellerPortfolioId, { cash_balance: sellerNewBalance });

        // 3. Record Transactions        // Record buyer's transaction
        await createTransactionService({
            portfolio_id: buyerPortfolioId,
            stock_id: stockId,
            transaction_type: 'Buy',
            quantity: quantity,
            price: price
        });

        // Record seller's transaction
        await createTransactionService({
            portfolio_id: sellerPortfolioId,
            stock_id: stockId,
            transaction_type: 'Sell',
            quantity: quantity,
            price: price
        });

        await client.query('COMMIT');
        
        return {
            status: 'success',
            message: 'Order settled successfully',
            details: {
                stockId,
                quantity,
                price,
                totalValue,
                buyerNewBalance,
                sellerNewBalance
            }
        };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error settling matched order:', error);
        throw new Error(`Failed to settle matched order: ${error.message}`);
    } finally {
        client.release();
    }
};
