/**
 * This service is responsible for operations related to the transactions table, which include:
 * - creating a new transaction (when order is matcheed, create transactions for both seller and buyer)
 * - retrieving transactions by portfolio ID (so that a user can view their transaction history)
 */
import pool from '../config/dbConnect.js';
import Transaction from '../models/transactionModel.js';

// Create a new transaction
export const createTransactionService = async (transactionData) => {
    const {portfolio_id, stock_id, transaction_type, quantity, price} = transactionData;

    try{
        console.log("Create transaction:", {portfolio_id, stock_id, transaction_type, quantity, price});

        const result = await pool.query(
            'INSERT INTO transactions (portfolio_id, stock_id, transaction_type, quantity, price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [portfolio_id, stock_id, transaction_type, quantity, price]
        );
        return Transaction.getTransaction(result.rows[0]);
    }
    catch(error){
        console.error('Error:', error.message);
        throw new Error(error.message);
    }
};


// Retrieve transactions by portfolio ID
export const getTransactionsByPortfolioIdService = async (portfolioId) => {
    try{
        const result = await pool.query('SELECT * FROM transactions WHERE portfolio_id = $1', [portfolioId]);
        return result.rows.map(Transaction.getTransaction);
    }
    catch(error){
        console.error('Error:', error.message);
        throw new Error(error.message);
    }
};
