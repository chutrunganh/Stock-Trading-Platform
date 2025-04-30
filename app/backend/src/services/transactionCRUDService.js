// SQL queries to retrieves transactions information from the Transactions table

import pool from '../config/dbConnect.js';
import Transaction from '../models/transactionModel.js';
//CRUD Services

//create
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

// //read

// //get all transactions(for admin)

// export const getAllTransactionsService = async () => {
//     try{
//         const result = await pool.query('SELECT * FROM transactions');
//         return result.rows;
//     }
//     catch (error){
//         throw new Error('Error occurs when getting all transactions:', error.message);
//     }
// };

// //get transaction by portfolio_id - specific user

// export const getTransactionByPortfolioIdService = async (portfolio_id) => {
//     try {
//         const result = await pool.query(
//             'SELECT * FROM transactions WHERE portfolio_id = $1',
//         [portfolio_id]);
//         if (!result.rows[0]){ //no transaction found
//             throw new Error('This user does not have any transaction');
//         }
//         return Transaction.getTransaction(result.rows[0]);
//     }
//     catch(error){
//         throw error;
//     }
// };

// //get transaction by stock_id - get transaction history of a specific stock
// export const getTransactionByStockIdService = async (stock_id) => {
//     try {
//         const result = await pool.query(
//             'SELECT * FROM transactions WHERE stock_id = $1',
//         [stock_id]);
//         if (!result.rows[0]){ //no transaction found
//             throw new Error('This stock does not have any transaction history');
//         }
//         return Transaction.getTransaction(result.rows[0]);
//     }
//     catch(error){
//         throw error;
//     }
// };

// //for update - i think that the information about transaction should be fixed




// //delete a transaction from the table

// //delete transaction by portfolio_id - specific user
// // this should only be performed after an user is deleted from the system
// export const deleteTransactionByPortfolioIdService = async (portfolio_id) => {
//     try{
//         const result = await pool.query(
//             'DELETE FROM transactions WHERE portfolio_id = $1 RETURNING *',
//             [portfolio_id]
//         );
//         if (!result.rows[0]){ //no transaction found
//             throw new Error('This user does not have any transaction to delete');
//         }
//         return Transaction.getTransaction(result.rows[0]);
//     }
//     catch(error){
//         throw error;
//     }
// };



// //delete transaction by stock_id - delete all transactions of a specific stock (for admin only)
// //this should only be performed after a stock is deleted from the system
// export const deleteTransactionByStockIdService = async (stock_id) => {
//     try{
//         const result = await pool.query(
//             'DELETE FROM transactions WHERE stock_id = $1 RETURNING *',
//             [stock_id]
//         );
//         if (!result.rows[0]){ //no transaction found
//             throw new Error('This stock does not have any transaction to delete');
//         }
//         return Transaction.getTransaction(result.rows[0]);
//     }
//     catch(error){
//         throw error;
//     }
// };


