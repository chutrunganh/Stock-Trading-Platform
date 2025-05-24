import apiClient from './apiClient';

/**
 * API functions for managing trading sessions
 */

/**
 * Get the current trading session status
 * @returns {Promise<Object>} Response from the server containing isActive status
 */
export const getTradingSessionStatus = async () => {
  try {
    const response = await apiClient.get('/trading-session/status');
    return response.data;
  } catch (error) {
    console.error('Error getting trading session status:', error);
    return next(error);
  }
};

/**
 * Start a new trading session
 * @returns {Promise<Object>} Response from the server
 */
export const startTradingSession = async () => {
  try {
    const response = await apiClient.post('/trading-session/start');
    return response.data;
  } catch (error) {
    console.error('Error starting trading session:', error);
    return next(error);
  }
};

/**
 * Stop the current trading session
 * @returns {Promise<Object>} Response from the server
 */
export const stopTradingSession = async () => {
  try {
    const response = await apiClient.post('/trading-session/stop');
    return response.data;
  } catch (error) {
    console.error('Error stopping trading session:', error);
    return next(error);
  }
}; 