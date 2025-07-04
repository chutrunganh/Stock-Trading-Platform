/**
 * @file stockCRUDService.js
 * @description This file contains the service to create a new stock, get a stock by symbol.
 */
import pool from "../config/dbConnect.js";
import Stocks from "../models/stockModel.js";

// Add a new stock code to the stocks table
export const createStockService = async (stockData) => {
    const { symbol, company_name, industry, market_cap, description } = stockData;
    try {
        console.log("Create stock:", { symbol, company_name, industry, market_cap, description });
        const result = await pool.query(
            'INSERT INTO stocks (symbol, company_name, industry, market_cap, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [symbol, company_name, industry, market_cap, description]
        );
        return Stocks.getStocks(result.rows[0]);
    }
    catch (error) {
        console.error('Error when create stock:', error.message);
        throw new Error(error.message);
    }
};


// Get stock by symbol - for searching
export const getStockBySymbolService = async (symbol) => {
    try {
        const result = await pool.query(
            'SELECT stock_id as id, symbol, company_name, industry, market_cap, description FROM stocks WHERE symbol = $1',
            [symbol]
        );
        
        //console.log('Query result:', result.rows); // Debug log
        
        if (!result.rows[0]) { //no stock found
            throw new Error(`Stock with symbol ${symbol} does not exist`);
        }
        
        const stock = {
            ...result.rows[0],
            id: result.rows[0].id // Ensure id is properly mapped from stock_id
        };
        
        //console.log('Returning stock:', stock); // Debug log
        return stock;
    }
    catch (error) {
        throw error;
    }
};
