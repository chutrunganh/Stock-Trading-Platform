import pool from './dbConnect.js'
import log from '../utils/loggerUtil.js';

const createHoldingTable = async () => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS "holdings"(
        holding_id SERIAL PRIMARY KEY,
        portfolio_id INT NOT NULL,
        stock_id INT NOT NULL,
        quantity INT,
        average_price DECIMAL(10,2),
        CONSTRAINT holdings_portfolio UNIQUE(portfolio_id, stock_id),
        FOREIGN KEY (portfolio_id) REFERENCES portfolios(portfolio_id) ON DELETE CASCADE,
        FOREIGN KEY (stock_id) REFERENCES stocks(stock_id) ON DELETE CASCADE
    )`;

    try{
        if(process.env.NODE_ENV === 'development'){
            //drop the table to recreate
            await pool.query('DROP TABLE IF EXISTS "holdings" CASCADE');
        }
        await pool.query(queryText);
        if(process.env.NODE_ENV === 'development'){
            await seedHoldingTestData();
        }
    }
    catch(error){
        log.error('\nError occurs when creating holdings table:', error.message);
        throw new Error(error.message);
    }
};

const seedHoldingTestData = async () => {
    try{
        const queryText = `
        INSERT INTO holdings (portfolio_id, stock_id, quantity, average_price)
        VALUES
        (1,1,10,150.00),
        (1,2,50,200.00)`;
        await pool.query(queryText);
        //console.log('\nTest data added to holdings table successfully');
    }
    catch(error){
        log.error('\nError adding test data for holdings table:', error.message);
    }
}

export default createHoldingTable;