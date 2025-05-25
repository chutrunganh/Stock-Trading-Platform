import apiClient from './apiClient';
import eventEmitter from '../services/eventEmitter';

/**
 * Get stock details by symbol. When user place an order, they use the stock name, but in the backend it only owkr with stock id. So we need to conver
 * these two things between each other sides.
 * @param {string} symbol - The stock symbol to look up
 * @returns {Promise} The stock details
 */
export const getStockBySymbol = async (symbol) => {
  try {
    const response = await apiClient.get(`/stocks/symbol/${symbol}`);
    if (!response.data) {
      return null;
    }
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error(`Stock ${symbol} not found`);
    }
    console.error('Error fetching stock details:', error);
    throw new Error('Failed to fetch stock details. Please try again.');
  }
};

/**
 * Create a new order (buy or sell)
 * Note: userId is extracted from JWT token by the backend for security (IDOR prevention)
 * @param {Object} orderData - The order data
 * @param {string} orderData.stockId - The stock's ID
 * @param {number} orderData.quantity - The quantity of stocks to buy/sell
 * @param {number} orderData.price - The price per stock (for limit orders)
 * @param {string} orderData.orderType - The type of order ("Market Buy", "Market Sell", "Limit Buy", "Limit Sell")
 * @returns {Promise} The created order
 */

export const createOrder = async (orderData) => {
  try {
    const response = await apiClient.post('/orders/createOrder', orderData);
    // Emit order created event for the app to respond to
    if (response.data.success !== false) { // Only emit if order actually created
      eventEmitter.emit('orderCreated', response.data);
    }
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Cancel an existing order
 * @param {string} orderId - The ID of the order to cancel
 * @returns {Promise} The result of the cancellation
 */
export const cancelOrder = async (orderId) => {
  try {
    const response = await apiClient.delete(`/orders/cancelOrder/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Error canceling order:', error);
    throw error;
  }
};

/**
 * Get most traded stocks
 * This is a placeholder that would normally fetch from the backend but in this project we are using fixed data.
 * This is the section that is display in the Most Traded Stocks section box of the trade page.
 * @returns {Promise} Array of most traded stocks
 */
export const getMostTradedStocks = async () => {
  // In a real implementation, this would be an API call
  // For now returning mock data
  return [
    { ticker: 'AAPL', name: 'APPLE INC', price: 196.98, changePercent: 1.39, changeValue: 2.71, chartData: [180, 185, 183, 190, 195, 192, 198, 196, 193, 195] },
    { ticker: 'NVDA', name: 'NVIDIA CORPORATION', price: 101.49, changePercent: -2.87, changeValue: -3.00, chartData: [110, 108, 112, 105, 103, 100, 102, 101, 104, 99] },
    { ticker: 'TSLA', name: 'TESLA, INC.', price: 241.37, changePercent: -0.07, changeValue: -0.18, chartData: [230, 235, 228, 240, 245, 238, 242, 241, 248, 240] },
    { ticker: 'COST', name: 'COSTCO WHOLESALE', price: 994.50, changePercent: 2.76, changeValue: 26.75, chartData: [950, 960, 955, 970, 985, 975, 995, 994, 980, 990] },
    { ticker: 'NFLX', name: 'NETFLIX, INC.', price: 973.03, changePercent: 1.19, changeValue: 11.40, chartData: [920, 930, 925, 940, 955, 945, 965, 973, 960, 970] },
    { ticker: 'MSFT', name: 'MICROSOFT CORP', price: 415.50, changePercent: 0.85, changeValue: 3.50, chartData: [400, 405, 402, 410, 412, 408, 415, 413, 416, 415] },
  ];
};
