/**
 * @file createStockPriceTable.js
 * @description This file contains the function to create the stockPrice table in the database.
 * This table will be seeded as the initial price data for all stocks in the stock table.
 * This table contains all the fields needed to draw a candlestick chart for each stock.
 */
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
        (1, '2024-10-01', 150.00, 155.00, 148.00, 153.00, 1000000),
        (2, '2024-10-01', 200.00, 205.00, 198.00, 202.00, 2000000),
        (3, '2024-10-01', 75.00, 80.00, 70.00, 78.00, 500000),
        (4, '2024-10-01', 50.00, 55.00, 48.00, 52.00, 300000),
        (5, '2024-10-01', 100.00, 105.00, 95.00, 102.00, 700000),
        (6, '2024-10-01', 150.00, 155.00, 145.00, 152.00, 1200000),
        (7, '2024-10-01', 2800.00, 2850.00, 2750.00, 2825.00, 800000),
        (8, '2024-10-01', 330.00, 340.00, 320.00, 335.00, 900000),
        (9, '2024-10-01', 125.00, 130.00, 120.00, 128.00, 600000),
        (10, '2024-10-01', 700.00, 720.00, 680.00, 710.00, 400000),
        (11, '2024-10-01', 300.00, 310.00, 290.00, 305.00, 500000),
        (12, '2024-10-01', 450.00, 460.00, 440.00, 455.00, 700000),
        (13, '2024-10-01', 500.00, 505.00, 495.00, 502.00, 1000),
        (14, '2024-10-01', 150.00, 155.00, 145.00, 152.00, 800000),
        (15, '2024-10-01', 200.00, 210.00, 190.00, 205.00, 900000)`;
        await pool.query(queryText);
        //console.log('Test data added to stock prices table successfully');
    }
    catch(error){
       log.error('Error adding test data for stock prices table:', error);
    }
};


export default createStockPriceTable;