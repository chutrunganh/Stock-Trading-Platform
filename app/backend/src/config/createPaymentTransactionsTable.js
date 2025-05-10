import pool from './dbConnect.js';
import log from '../utils/loggerUtil.js';

const createPaymentTransactionsTable = async () => {
    try {
        // Development mode - drop table if exists
        if (process.env.NODE_ENV === 'development') {
            await pool.query('DROP TABLE IF EXISTS payment_transactions CASCADE');
        }

        await pool.query(`
            CREATE TABLE IF NOT EXISTS payment_transactions (
                id SERIAL PRIMARY KEY,
                portfolio_id INTEGER NOT NULL REFERENCES portfolios(portfolio_id),
                reference_number VARCHAR(255) NOT NULL UNIQUE,
                vnd_amount DECIMAL(15,2) NOT NULL,
                virtual_amount DECIMAL(15,2) NOT NULL,
                status VARCHAR(50) NOT NULL DEFAULT 'completed',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        log.info('Payment transactions table created successfully');
    } catch (error) {
        log.error('Error creating payment transactions table:', error);
        throw error;
    }
};

export default createPaymentTransactionsTable; 