import apiClient from './apiClient';

// Get stock price history for a specific stock
export const getStockPriceHistory = async (stockId) => {
  try {
    if (!stockId) {
      return next(new Error('Stock ID is required'));
    }
    console.log(`Fetching stock price history for stock ID: ${stockId}`);
    const response = await apiClient.get(`/stockPrice/${stockId}`);
    
    // Extract the data array from the response
    if (!response.data || !response.data.data) {
      return next(new Error('Invalid response format from server'));
    }
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching stock price history for ID ${stockId}:`, error);
    return next(error);
  }
};

// Get stock details by symbol
export const getStockDetails = async (symbol) => {
  try {
    if (!symbol) {
      return next(new Error('Stock symbol is required'));
    }
    console.log(`Fetching stock details for symbol: ${symbol}`);
    const response = await apiClient.get(`/stocks/symbol/${symbol}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching stock details for symbol ${symbol}:`, error);
    return next(error);
  }
}; 