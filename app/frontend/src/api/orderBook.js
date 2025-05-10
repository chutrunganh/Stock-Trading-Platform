import apiClient, { createSSEConnection } from './apiClient';

/**
 * Get order book data from the backend. This includes:
 * - Stock information (symbol, company name)
 * - Reference prices (ref, ceiling, floor)
 * - Current order book state (bids, asks, matched trades)
 * @returns {Promise} The order book data for all stocks
 */
export const getOrderBookData = async () => {
  try {
    const response = await apiClient.get('/orders/orderBook');
    return response.data;
  } catch (error) {
    console.error('Error fetching order book data:', error);
    throw new Error('Failed to fetch order book data. Please try again.');
  }
};

/**
 * Creates an EventSource connection to the server for real-time updates.
 * @returns {EventSource} The EventSource object for the SSE connection
 */
export const createOrderBookStream = () => {
  return createSSEConnection('/orders/orderBook/stream');
};
