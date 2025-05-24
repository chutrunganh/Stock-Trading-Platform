import pool from '../config/dbConnect.js';
import StockPrices from '../models/stockPriceModel.js';

// Get all stock prices
export const getAllStockPricesService = async () => {
    try {
        const query = `
            SELECT sp.*, s.symbol 
            FROM stockprices sp
            JOIN stocks s ON sp.stock_id = s.stock_id
            ORDER BY sp.date DESC`;
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error getting all stock prices:', error.message);
        return next(error);
    }
};

// Get stock prices by stock ID
export const getStockPricesByStockIdService = async (stockId) => {
    try {
        console.log('Getting stock prices for stock ID:', stockId);
        const query = `
            SELECT sp.*, s.symbol 
            FROM stockprices sp
            JOIN stocks s ON sp.stock_id = s.stock_id
            WHERE sp.stock_id = $1
            ORDER BY sp.date DESC`;
        const result = await pool.query(query, [stockId]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return result.rows;
    } catch (error) {
        console.error('Error getting stock prices by ID:', error.message);
        return next(error);
    }
};

// Add a new stock price to the stockprices table
export const createStockPriceService = async (stockpriceData) => {
    const {stock_id, date, open_price, high_price, low_price, close_price, volume} = stockpriceData;
    try{
        console.log("Create stock price:", {stock_id, date, open_price, high_price, low_price, close_price, volume});
        const result = await pool.query(
            'INSERT INTO stockprices (stock_id, date, open_price, high_price, low_price, close_price, volume) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [stock_id, date, open_price, high_price, low_price, close_price, volume]
        );
        return StockPrices.getStockPrices(result.rows[0]);
    }
    catch(error){
        console.error('Error when create stock price:', error.message);
        return next(new Error(error.message));
    }
};

// Get latest stock price for a specific stock
export const getLatestStockPriceByStockIdService = async (stockId) => {
    try {
        const query = 'SELECT close_price as reference_price, date as price_date FROM stockprices WHERE stock_id = $1 ORDER BY date DESC LIMIT 1';
        const result = await pool.query(query, [stockId]);

        if (!result.rows[0]) {
            return next(new Error('This stock does not have any price history'));
        }

        return result.rows[0];
    } catch (error) {
        return next(error);
    }
};

// Get all stocks with their latest prices
export const getAllStocksWithLatestPricesService = async () => {
    try {
        const query = `
            WITH latest_prices AS (
                SELECT DISTINCT ON (stock_id) 
                    stock_id,
                    close_price as reference_price,
                    date as price_date
                FROM stockprices
                ORDER BY stock_id, date DESC
            )
            SELECT s.stock_id, s.symbol, s.company_name, lp.reference_price, lp.price_date 
            FROM stocks s 
            LEFT JOIN latest_prices lp ON s.stock_id = lp.stock_id 
            ORDER BY s.symbol`;
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        return next(error);
    }
};

// Record session prices when market closes
export const recordSessionPricesService = async (client = pool) => {
    try {
        // Start a transaction
        await client.query('BEGIN');

        // Get all stocks
        const stocksResult = await client.query('SELECT stock_id FROM stocks');
        const stocks = stocksResult.rows;

        // Get the current date for the session
        const currentDate = new Date();

        for (const stock of stocks) {
            // Get all matched trades for this stock in the current session
            const tradesQuery = `
                SELECT price, quantity, transaction_date
                FROM transactions
                WHERE stock_id = $1
                AND DATE(transaction_date) = CURRENT_DATE
                ORDER BY transaction_date ASC`;
            
            const tradesResult = await client.query(tradesQuery, [stock.stock_id]);
            const trades = tradesResult.rows;

            // Get the previous session's prices
            const previousPriceQuery = `
                SELECT close_price
                FROM stockprices
                WHERE stock_id = $1
                ORDER BY date DESC
                LIMIT 1`;
            
            const previousPriceResult = await client.query(previousPriceQuery, [stock.stock_id]);
            const previousClosePrice = previousPriceResult.rows[0]?.close_price;

            let openPrice, closePrice, highPrice, lowPrice, volume;

            if (trades.length > 0) {
                // Calculate prices from trades
                openPrice = trades[0].price;
                closePrice = trades[trades.length - 1].price;
                highPrice = Math.max(...trades.map(t => t.price));
                lowPrice = Math.min(...trades.map(t => t.price));
                volume = trades.reduce((sum, t) => sum + t.quantity, 0);
            } else {
                // No trades, use previous session's close price
                if (!previousClosePrice) {
                    console.warn(`No previous price found for stock ${stock.stock_id}, skipping...`);
                    continue;
                }
                openPrice = previousClosePrice;
                closePrice = previousClosePrice;
                highPrice = previousClosePrice;
                lowPrice = previousClosePrice;
                volume = 0;
            }

            // Insert the session prices
            await client.query(
                `INSERT INTO stockprices 
                (stock_id, date, open_price, high_price, low_price, close_price, volume)
                VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [stock.stock_id, currentDate, openPrice, highPrice, lowPrice, closePrice, volume]
            );
        }

        // Commit the transaction
        await client.query('COMMIT');
        console.log('Successfully recorded session prices for all stocks');
    } catch (error) {
        // Rollback in case of error
        await client.query('ROLLBACK');
        console.error('Error recording session prices:', error);
        return next(error);
    }
};

//no delete needed
//because the stock price has foreign constraints to stocks table
//so if the stock is deleted, its stock price history will be deleted as well

