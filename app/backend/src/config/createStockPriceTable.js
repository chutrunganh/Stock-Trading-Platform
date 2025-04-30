import pool from './dbConnect.js';
import log from '../utils/loggerUtil.js';
const createStockPriceTable = async () => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS "stockprices"(
        price_id SERIAL PRIMARY KEY,
        stock_id INT NOT NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        open_price DECIMAL(10,2) NOT NULL,
        high_price DECIMAL(10,2) NOT NULL,
        low_price DECIMAL(10,2) NOT NULL,
        close_price DECIMAL(10,2) NOT NULL,
        volume INT NOT NULL,
        CONSTRAINT unique_stock_date UNIQUE(stock_id, date),
        FOREIGN KEY (stock_id) REFERENCES stocks(stock_id) ON DELETE CASCADE
    )`;

    /**
     * The open price in our simulate is the price of the first transaction of the day.
     * The high price is the highest price of the day.
     * The low price is the lowest price of the day.
     * The close price is the price of the last transaction of the day.
     * -> These prices together with the data are used to draw the candlestick chart.
     * The volume is the number of shares traded during the day.
     */

    //Delete on cascade means if the stock is deleted, the price history will be deleted as well.
    try{
        if (process.env.NODE_ENV === 'development'){
            //drop the table to recreate
            await pool.query('DROP TABLE IF EXISTS "stockprices" CASCADE');
        }
        await pool.query(queryText);
        //console.log('\nStock prices table created successfully');

        if (process.env.NODE_ENV === 'development'){
            await seedStockPriceTestData();
        }

    }
    catch(error){
        console.error('\nError occurs when creating StockPrices table:', error.message);
        throw new Error(error.message);
    }
};

const seedStockPriceTestData = async () => {
    try{
        const queryText = `
        INSERT INTO stockprices (stock_id, date, open_price, high_price, low_price, close_price, volume)
        VALUES
        (1, '2023-10-01', 150.00, 155.00, 148.00, 153.00, 1000000),
        (2, '2023-10-01', 200.00, 205.00, 198.00, 202.00, 2000000),
        (1, '2023-10-02', 155.00, 160.00, 146.00, 155.00, 1000000)`;
        await pool.query(queryText);
        //console.log('Test data added to stock prices table successfully');
    }
    catch(error){
       log.error('Error adding test data for stock prices table:', error);
    }
};


export default createStockPriceTable;