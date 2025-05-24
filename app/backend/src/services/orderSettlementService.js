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
    //define the balance of both side first
    let buyerNewBalance = 'N/A (Artificial)'; 
    let sellerNewBalance = 'N/A (Artificial)';
    try {
        await client.query('BEGIN'); // Start transaction
        // Calculate total transaction value (rounded to 2 decimal places)
        const totalValue = Number((quantity * price).toFixed(2));

        // 1. Update Holdings - only if the portfolioId is not null (not an artificial order)
        // For buyer: Increase holdings if it's a real user (not artificial)
        if (buyerPortfolioId !== null) {
            await updateHoldingService(buyerPortfolioId, stockId, quantity, price, true, client);
        }
        
        // For seller: Decrease holdings if it's a real user (not artificial)
        if (sellerPortfolioId !== null) {
            await updateHoldingService(sellerPortfolioId, stockId, quantity, price, false, client);
        }

        // 2. Update Portfolio Balances - only if the portfolioId is not null
        // Deduct money from buyer
        if (buyerPortfolioId !== null) {
            const buyerPortfolio = await client.query('SELECT cash_balance FROM portfolios WHERE portfolio_id = $1', [buyerPortfolioId]);
            buyerNewBalance = Number((parseFloat(buyerPortfolio.rows[0].cash_balance) - totalValue).toFixed(2));
            await updatePortfolioService(buyerPortfolioId, { cash_balance: buyerNewBalance });
        }
        
        // Add money to seller
        if (sellerPortfolioId !== null) {
            const sellerPortfolio = await client.query('SELECT cash_balance FROM portfolios WHERE portfolio_id = $1', [sellerPortfolioId]);
            sellerNewBalance = Number((parseFloat(sellerPortfolio.rows[0].cash_balance) + totalValue).toFixed(2));
            await updatePortfolioService(sellerPortfolioId, { cash_balance: sellerNewBalance });
        }

        // 3. Record Transactions - only if the portfolioId is not null
        // Record buyer's transaction
        if (buyerPortfolioId !== null) {
            await createTransactionService({
                portfolio_id: buyerPortfolioId,
                stock_id: stockId,
                transaction_type: 'Buy',
                quantity: quantity,
                price: price
            });
        }

        // Record seller's transaction
        if (sellerPortfolioId !== null) {
            await createTransactionService({
                portfolio_id: sellerPortfolioId,
                stock_id: stockId,
                transaction_type: 'Sell',
                quantity: quantity,
                price: price
            });
        }

        await client.query('COMMIT');
        
        return {
            status: 'success',
            message: 'Order settled successfully',
            details: {
                stockId,
                quantity,
                price,
                totalValue,
                buyerNewBalance: buyerPortfolioId,
                sellerNewBalance: sellerPortfolioId 
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