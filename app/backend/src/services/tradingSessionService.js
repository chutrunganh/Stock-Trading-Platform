/**
 * This service is responsible for managing the trading session, which includes:
 * - activating and deactivating the trading session (admin will use this function to control the trading session)
 * - checking if the trading session is active or not
 */

// --- Logging ---
import log from '../utils/loggerUtil.js';
import { recordSessionPricesService } from './stockPriceCRUDService.js';
import { OrderBook } from './orderMatchingService.js';
import pool from '../config/dbConnect.js';

let isTradingSessionActive = true; // By default when the server starts, the trading session is active

export const activateTradingSession = async () => {
    try {
 
        
        isTradingSessionActive = true;
        log.info('Trading session started with fresh orderbook.');
        
        // Emit update to refresh the UI with latest prices
        // await emitOrderBookUpdate();
    } catch (error) {
        log.error('Error starting trading session:', error);
        return next(error);
    }
};

export const deactivateTradingSession = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Record session prices
        await recordSessionPricesService(client);

        // Clear the orderbook when starting a new session
        const orderBook = OrderBook.getInstance();
        orderBook.clearOrderBook();

        isTradingSessionActive = false;
        log.info('Trading session stopped and prices recorded.');

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        log.error('Error in deactivating trading session:', error);
        return next(error);
    } finally {
        client.release();
    }
};

export const isTradingSessionActiveStatus = () => {
    return isTradingSessionActive;
};
