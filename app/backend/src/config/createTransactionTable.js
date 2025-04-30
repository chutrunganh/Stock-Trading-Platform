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
        console.log('Transaction table created successfully');
        //If in dev mode, test with some seed data

        if (process.env.NODE_ENV === 'development'){
            await seedTransactionTestData();
        }
    }
    catch(error){
        console.error('Error occurs when creating transaction table:', error.message);
        throw new Error(error.message);
    }
};

// //seed function for transaction table
// const seedTransactionTestData = async () => {
//     try{
//         const seedQuery = `
//         INSERT INTO transactions (portfolio_id, stock_id, transaction_type, quantity, price)
//         VALUES
//         (1, 1, 'BUY', 10, 150.00),
//         (1, 2, 'SELL', 100, 200.00)`;
//         await pool.query(seedQuery);
//         console.log('add test data to transaction table successfully');
//     }
//     catch(error){
//         console.error('Error adding test data:', error.message);
//     }
// };

export default createTransactionTable;