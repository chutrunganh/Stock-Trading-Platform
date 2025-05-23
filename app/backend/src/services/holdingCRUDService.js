import pool from '../config/dbConnect.js';
import Holdings from '../models/holdingModel.js';
import { DEFAULT_HOLDING_QUANTITY, DEFAULT_HOLDING_COST } from '../config/constants.js';

// Service to create default holdings for a new portfolio
export const createDefaultHoldingsForPortfolioService = async (portfolioId, client) => {
    try {
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(portfolioId)) {
            throw new Error('Invalid portfolio ID format');
        }

        // Get all stock IDs from the stocks table
        const stocksResult = await client.query('SELECT stock_id FROM stocks'); // Corrected column name
        const stockIds = stocksResult.rows.map(stock => stock.stock_id); // Corrected property access

        if (stockIds.length === 0) {
            console.log('No stocks found in the database. Skipping default holdings creation.');
            return; // No stocks to add holdings for
        }

        // Prepare bulk insert query
        const values = [];
        const valuePlaceholders = [];
        stockIds.forEach((stockId, index) => {
            const baseIndex = index * 4;
            valuePlaceholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`);
            values.push(portfolioId, stockId, DEFAULT_HOLDING_QUANTITY, DEFAULT_HOLDING_COST);
        });

        const queryText = `INSERT INTO holdings (portfolio_id, stock_id, quantity, average_price) VALUES ${valuePlaceholders.join(', ')}`;

        console.log(`Creating default holdings for portfolio ${portfolioId} for ${stockIds.length} stocks.`);
        await client.query(queryText, values);
        console.log(`Successfully created default holdings for portfolio ${portfolioId}.`);

    } catch (error) {
        console.error(`Error creating default holdings for portfolio ${portfolioId}:`, error.message);
        // Re-throw the error to be caught by the transaction handler in userCRUDService
        throw new Error(`Failed to create default holdings: ${error.message}`);
    }
};

// Update holding after a trade
export const updateHoldingService = async (portfolioId, stockId, quantity, price, isBuying, client = pool) => {
    try {        // Get current holding
        const currentHolding = await client.query(
            'SELECT quantity, average_price FROM holdings WHERE portfolio_id = $1 AND stock_id = $2',
            [portfolioId, stockId]
        );

        if (!currentHolding.rows[0]) {
            throw new Error(`No holding found for portfolio ${portfolioId} and stock ${stockId}`);
        }

        let { quantity: currentQty, average_price: currentAvgPrice } = currentHolding.rows[0];
        let newQuantity, newAveragePrice;        if (isBuying) {
            // Calculate new average price when buying
            newQuantity = currentQty + quantity;
            // For simplicity, use the matched price as the new average price as suggested
            newAveragePrice = price;
        } else {
            // For selling, reduce quantity and keep same average price
            newQuantity = currentQty - quantity;
            if (newQuantity < 0) {
                throw new Error('Insufficient shares to sell');
            }
            newAveragePrice = currentAvgPrice; // Average price doesn't change when selling
        }

        // Update the holding
        const result = await client.query(
            'UPDATE holdings SET quantity = $1, average_price = $2 WHERE portfolio_id = $3 AND stock_id = $4 RETURNING *',
            [newQuantity, newAveragePrice, portfolioId, stockId]
        );

        return Holdings.getHoldings(result.rows[0]);
    } catch (error) {
        console.error('Error updating holding:', error);
        throw error;
    }
};

// Get holding by portfolio and stock
export const getHoldingByPortfolioAndStockService = async (portfolioId, stockId, client = pool) => {
    try {
        const result = await client.query(
            'SELECT * FROM holdings WHERE portfolio_id = $1 AND stock_id = $2',
            [portfolioId, stockId]
        );
        if (!result.rows[0]) {
            throw new Error(`No holding found for portfolio ${portfolioId} and stock ${stockId}`);
        }
        return Holdings.getHoldings(result.rows[0]);
    } catch (error) {
        console.error('Error getting holding:', error);
        throw error;
    }
};
