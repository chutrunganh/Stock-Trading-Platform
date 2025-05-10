/**
 * @file createTransactionTable.js
 * @description This file contains the function to create the transaction table in the database.
 * When an order is successfully matching, a transaction will be written into this table.
 */
import pool from './dbConnect.js';
import log from '../utils/loggerUtil.js';

const createTransactionTable = async () => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS "transactions"(
      transaction_id SERIAL PRIMARY KEY,
      portfolio_id INT NOT NULL,
      stock_id INT NOT NULL,
      transaction_type VARCHAR(100) NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stock_id) REFERENCES stocks(stock_id) ON DELETE CASCADE,
      FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id) ON DELETE CASCADE
    )`;
    //delete on cascade means if the stock is deleted
    //transaction history of that stock will be deleted as well
    try{
        //development mode
        if (process.env.NODE_ENV === 'development'){
            //drop the table to recreate
            await pool.query('DROP TABLE IF EXISTS "transactions" CASCADE');
        }
        
        await pool.query(queryText);

    }
    catch(error){
        console.error('Error occurs when creating transaction table:', error.message);
        throw new Error(error.message);
    }
};


export default createTransactionTable;