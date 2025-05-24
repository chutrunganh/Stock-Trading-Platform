import pool from '../config/dbConnect.js';
import axios from 'axios';
import log from '../utils/loggerUtil.js';

// Seem like the dot env file can be loaded automatically without importing it ?
const SEPAY_API_TOKEN = process.env.SEPAY_API_TOKEN;
const SEPAY_API_URL = process.env.SEPAY_BASE_API_URL;

export const verifyPayment = async (referenceNumber, portfolioId) => {
    const client = await pool.connect();
    try {
        log.info('SEPAY_API_TOKEN', SEPAY_API_TOKEN);
        log.info('SEPAY_API_URL', SEPAY_API_URL);
        await client.query('BEGIN');

        // Log initial state
        log.info('Starting payment verification:', { referenceNumber, portfolioId });

        // Check if reference number was already used
        const existingTransaction = await client.query(
            'SELECT * FROM payment_transactions WHERE reference_number = $1',
            [referenceNumber]
        );

        if (existingTransaction.rows.length > 0) {
            return next(new Error('This payment has already been processed'));
        }

        // Get current portfolio balance
        const currentBalance = await client.query(
            'SELECT cash_balance FROM portfolios WHERE portfolio_id = $1',
            [portfolioId]
        );
        log.info('Current portfolio balance:', { 
            portfolioId, 
            currentBalance: currentBalance.rows[0]?.cash_balance 
        });

        // Verify with Sepay API
        const sepayResponse = await axios.get(`${SEPAY_API_URL}/transactions/list`, {
            params: { reference_number: referenceNumber },
            headers: {
                'Authorization': `Bearer ${SEPAY_API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        log.info('Sepay API response:', sepayResponse.data);

        if (!sepayResponse.data.transactions?.length) {
            return next(new Error('No transaction found with this reference number'));
        }

        // Find incoming transaction (looking for amount_in > 0)
        const incomingTransaction = sepayResponse.data.transactions.find(
            t => parseFloat(t.amount_in) > 0
        );

        if (!incomingTransaction) {
            return next(new Error('No incoming payment found with this reference number'));
        }

        const vndAmount = parseFloat(incomingTransaction.amount_in);
        const virtualAmount = vndAmount; // 1:1 conversion (1000 VND = 1000 USD)

        log.info('Payment amounts:', { vndAmount, virtualAmount });

        // Update portfolio balance
        const updateResult = await client.query(
            'UPDATE portfolios SET cash_balance = cash_balance + $1 WHERE portfolio_id = $2 RETURNING cash_balance',
            [virtualAmount, portfolioId]
        );

        log.info('Portfolio balance update result:', {
            portfolioId,
            newBalance: updateResult.rows[0]?.cash_balance
        });

        // Record transaction
        const transactionResult = await client.query(
            'INSERT INTO payment_transactions (portfolio_id, reference_number, vnd_amount, virtual_amount) VALUES ($1, $2, $3, $4) RETURNING *',
            [portfolioId, referenceNumber, vndAmount, virtualAmount]
        );

        log.info('Payment transaction recorded:', transactionResult.rows[0]);

        await client.query('COMMIT');

        return {
            success: true,
            vndAmount,
            virtualAmount,
            newBalance: updateResult.rows[0].cash_balance,
            transactionDetails: {
                bank: incomingTransaction.bank_brand_name,
                accountNumber: incomingTransaction.account_number,
                transactionDate: incomingTransaction.transaction_date,
                referenceNumber: incomingTransaction.reference_number
            }
        };
    } catch (error) {
        await client.query('ROLLBACK');
        log.error('Payment verification error:', error);
        return next(error);
    } finally {
        client.release();
    }
};