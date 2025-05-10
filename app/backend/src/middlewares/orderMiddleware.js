import pool from '../config/dbConnect.js'; // Assuming you have a database connection pool set up

// Define valid order types
const VALID_ORDER_TYPES = ['Market Buy', 'Market Sell', 'Limit Buy', 'Limit Sell'];

/**
 * Middleware to validate a limit order's price against floor and ceiling prices
 * For limit orders (both limit buy order and limit sell order), price must be within ±7% of the reference price
 */
const validateLimitOrderPrice = async (req, res, next) => {
    try {
        const { stockId, price, orderType } = req.body;

        // Validate required fields
        if (!stockId || !orderType) {
            return res.status(400).json({
                message: 'Missing required fields: stockId and orderType are required.',
                received: { stockId, orderType }
            });
        }

        // Ensure 'orderType' is a string before calling methods on it
        if (typeof orderType !== 'string') {
            return res.status(400).json({
                message: 'Invalid orderType: orderType must be a string.',
                received: { orderType }
            });
        }

        // Validate order type
        if (!VALID_ORDER_TYPES.includes(orderType)) {
            return res.status(400).json({
                message: 'Invalid order type',
                valid: VALID_ORDER_TYPES,
                received: orderType
            });
        }

        // Skip validation for market orders
        if (orderType.startsWith('Market')) {
            return next();
        }

        // For limit orders, price is required and must be a number
        if (price === undefined || price === null || typeof price !== 'number' || price <= 0) {
            return res.status(400).json({
                message: 'Price is required and must be a positive number for limit orders.',
                received: { price }
            });
        }

        // Get reference price from the most recent stock price
        const priceQuery = `
            SELECT close_price
            FROM stockprices
            WHERE stock_id = $1
            ORDER BY date DESC
            LIMIT 1`;

        const result = await pool.query(priceQuery, [stockId]);

        if (result.rows.length === 0) {
            return res.status(400).json({
                message: 'Could not find reference price for the given stock.',
                stockId
            });
        }

        const referencePrice = result.rows[0].close_price;
        const floorPrice = referencePrice * 0.93; // 7% down
        const ceilingPrice = referencePrice * 1.07; // 7% up

        if (price < floorPrice || price > ceilingPrice) {
            return res.status(400).json({
                message: `Order price (${price}) must be between floor (${floorPrice.toFixed(2)}) and ceiling (${ceilingPrice.toFixed(2)}) prices.`,
                floorPrice: floorPrice.toFixed(2),
                ceilingPrice: ceilingPrice.toFixed(2)
            });
        }

        next(); // Proceed if validation passes
    } catch (error) {
        console.error('Error in validateLimitOrderPrice middleware:', error);
        // Pass the error to the main error handler
        next(error);
    }
};

/**
 * Middleware to validate if a portfolio has enough stocks for a sell order
 * Applies to both market sell and limit sell orders
 */
const validateSellOrderQuantity = async (req, res, next) => {
    try {
        const { stockId, quantity, orderType, userId } = req.body;

        // Validate required fields
        if (!stockId || !quantity || !orderType || !userId) {
            return res.status(400).json({
                message: 'Missing required fields for sell order validation.',
                required: ['stockId', 'quantity', 'orderType', 'userId']
            });
        }

        // Ensure 'orderType' is a string
        if (typeof orderType !== 'string') {
             return res.status(400).json({ message: 'Invalid orderType: orderType must be a string.' });
        }

        // Skip validation for buy orders
        if (!orderType.includes('Sell')) {
            return next();
        }

        // Validate quantity
        if (typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
             return res.status(400).json({ message: 'Invalid quantity: Quantity must be a positive integer.' });
        }        // Get the portfolio for this user
        const portfolioQuery = `
            SELECT portfolio_id
            FROM portfolios
            WHERE user_id = $1`;

        const portfolioResult = await pool.query(portfolioQuery, [userId]);

        if (portfolioResult.rows.length === 0) {
            return res.status(404).json({
                message: 'No portfolio found for this user.',
                userId
            });
        }

        const portfolioId = portfolioResult.rows[0].portfolio_id;

        // Check current holdings
        const holdingsQuery = `
            SELECT quantity
            FROM holdings
            WHERE portfolio_id = $1 AND stock_id = $2`;

        const result = await pool.query(holdingsQuery, [portfolioId, stockId]);

        if (result.rows.length === 0 || result.rows[0].quantity < quantity) {
            return res.status(400).json({
                message: 'Insufficient stock quantity for sell order.',
                available: result.rows.length ? result.rows[0].quantity : 0,
                requested: quantity
            });
        }

        next(); // Proceed if validation passes
    } catch (error) {
        console.error('Error in validateSellOrderQuantity middleware:', error);
        next(error); // Pass the error to the main error handler
    }
};

/**
 * Middleware to validate if a portfolio has enough balance for a limit buy order
 * Skips validation for market buy orders as price is unknown in advance
 */
const validateBuyOrderBalance = async (req, res, next) => {
    try {
        const { stockId, quantity, price, orderType, userId } = req.body;

         // Validate required fields
        if (!stockId || !quantity || !orderType || !userId) {
            return res.status(400).json({
                message: 'Missing required fields for buy order validation.',
                required: ['stockId', 'quantity', 'orderType', 'userId']
            });
        }

        // Ensure 'orderType' is a string
        if (typeof orderType !== 'string') {
             return res.status(400).json({ message: 'Invalid orderType: orderType must be a string.' });
        }

        // Skip validation for sell orders and market buy orders
        if (!orderType.includes('Buy') || orderType.startsWith('Market')) {
            return next();
        }

        // Validate quantity
        if (typeof quantity !== 'number' || quantity <= 0 || !Number.isInteger(quantity)) {
             return res.status(400).json({ message: 'Invalid quantity: Quantity must be a positive integer.' });
        }

        // For limit buy orders, price is required
        if (price === undefined || price === null || typeof price !== 'number' || price <= 0) {
            return res.status(400).json({
                message: 'Price is required and must be a positive number for limit buy orders.',
                received: { price }
            });
        }        // Calculate the total cost of the order
        const orderCost = quantity * price;

        // Get the portfolio for this user
        const portfolioQuery = `
            SELECT portfolio_id, cash_balance
            FROM portfolios
            WHERE user_id = $1`;

        const result = await pool.query(portfolioQuery, [userId]);

        // Check if portfolio exists and has enough balance
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'No portfolio found for this user.',
                userId
            });
        }

        const portfolio = result.rows[0];
        if (portfolio.cash_balance < orderCost) {
            return res.status(400).json({
                message: 'Insufficient balance for buy order.',
                available: portfolio.cash_balance,
                required: orderCost
            });
        }

        next(); // Proceed if validation passes
    } catch (error) {
        console.error('Error in validateBuyOrderBalance middleware:', error);
        next(error); // Pass the error to the main error handler
    }
};


/**
 * Combined middleware that runs all order validations in sequence
 * Passes errors to the main error handler if any validation fails
 */
const validateOrder = (req, res, next) => {
    // Run validations sequentially
    validateLimitOrderPrice(req, res, (err1) => {
        if (err1) {
            // If price validation fails or throws an error, pass it to the error handler
            return next(err1);
        }
        // If price validation passes, proceed to quantity validation
        validateSellOrderQuantity(req, res, (err2) => {
            if (err2) {
                // If quantity validation fails or throws an error, pass it to the error handler
                return next(err2);
            }
            // If quantity validation passes, proceed to balance validation
            validateBuyOrderBalance(req, res, (err3) => {
                if (err3) {
                    // If balance validation fails or throws an error, pass it to the error handler
                    return next(err3);
                }
                // All validations passed
                next();
            });
        });
    });
};


export {
    validateOrder
};