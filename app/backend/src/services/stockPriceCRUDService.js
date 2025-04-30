import pool from '../config/dbConnect.js';
import StockPrices from '../models/stockPriceModel.js';

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
        throw new Error(error.message);
    }
};


// //read

// //get all stock prices - for admin
// export const getAllStockPricesService = async () => {
//     try{
//         const result = await pool.query('SELECT * FROM stockprices');
//         return result.rows;
//     }
//     catch (error){
//         throw new Error('Error occurs when getting all stock prices:', error.message);
//     }
// };

// //get all stock price by stock_id - for stock presentation

// export const getStockPricesByStockIdService = async (stock_id) => {
//     try {
//         const result = await pool.query(
//             'SELECT * FROM stockprices WHERE stock_id = $1 ORDER BY date ASC', //sort by date
//         [stock_id]);
//         if (!result.rows[0]){ //no stock price found
//             throw new Error('This stock does not have any price history');
//         }
//         return result.rows.map(row => StockPrices.getStockPrices(row)); //get all the rows needed
//     }
//     catch(error){
//         throw error;
//     }
// };

// //get the latest price of a stock given its stock_id - for transaction

// export const getLatestStockPriceByStockIdService = async (stock_id) => {
//     try {
//         const result = await pool.query(
//             'SELECT * FROM stockprices WHERE stock_id = $1 ORDER BY date DESC LIMIT 1', //find another way to get the lastest price
//         [stock_id]);
//         if (!result.rows[0]){ //no stock price found
//             throw new Error('This stock does not have any price history');
//         }
//         return StockPrices.getStockPrices(result.rows[0]);
//     }
//     catch(error){
//         throw error;
//     }
// };

//no update and delete
//because the stock price has foreign constraints to stocks table
//so if the stock is deleted, its stock price history will be deleted as well
//also the stock price is fixed, it should not be updated