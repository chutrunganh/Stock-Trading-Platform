import apiClient from './apiClient';

/**
 * Get portfolio details including cash balance and total value
 * @returns {Promise} Portfolio details
 */
export const getPortfolioDetails = async () => {
    const response = await apiClient.get('/portfolio/details');
    return response.data;
};

/**
 * Get user's holdings (stocks owned)
 * @returns {Promise} List of holdings
 */
export const getHoldings = async () => {
    const response = await apiClient.get('/portfolio/holdings');
    return response.data;
};

/**
 * Get user's transaction history
 * @returns {Promise} List of transactions
 */
export const getTransactions = async () => {
    const response = await apiClient.get('/portfolio/transactions');
    return response.data;
}; 