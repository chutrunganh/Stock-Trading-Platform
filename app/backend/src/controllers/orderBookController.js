/**
 * @file orderBookController.js
 * @description This file contains functions to help frontend display and efficiently update order book data.
 */

import { EventEmitter } from 'events';
import { getAllStocksWithLatestPricesService } from '../services/stockPriceCRUDService.js';
import { OrderBook } from '../services/orderMatchingService.js';

const sseClients = new Set();
const orderBookEmitter = new EventEmitter();

// Controller to handle SSE connections
export const orderBookSSE = (req, res) => {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Send heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
  }, 30000); // Send heartbeat every 30 seconds

  // Send initial data
  const sendInitialData = async () => {
    try {
      const stocksResult = await getAllStocksWithLatestPricesService();
      const orderBook = OrderBook.getInstance();
      const buyOrders = orderBook.limitBuyOrderQueue || [];
      const sellOrders = orderBook.limitSellOrderQueue || [];
      const recentTransactions = orderBook.recentTransactions || {};
      
      const processedData = processOrderBookData(stocksResult, buyOrders, sellOrders, recentTransactions);
      res.write(`data: ${JSON.stringify({ type: 'initial', data: processedData })}\n\n`);
      console.log(`[SSE] Initial data sent to new client. ${sseClients.size+1} total clients`);
    } catch (error) {
      console.error('Error sending initial data:', error);
    }
  };

  // Function to send updates to this client
  const sendUpdate = (update) => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'update', data: update })}\n\n`);
    } catch (error) {
      console.error('[SSE] Error sending update to client:', error);
      // Remove client if we can't send to it
      sseClients.delete(res);
      orderBookEmitter.removeListener('update', sendUpdate);
      if (heartbeat) clearInterval(heartbeat);
    }
  };

  // Add this client to our Set of active clients
  sseClients.add(res);
  
  // Send initial data
  sendInitialData();

  // Listen for updates
  orderBookEmitter.on('update', sendUpdate);

  // Handle client disconnect
  req.on('close', () => {
    console.log('[SSE] Client disconnected');
    sseClients.delete(res);
    orderBookEmitter.removeListener('update', sendUpdate);
    clearInterval(heartbeat);
  });
};

// Function to emit updates to all connected clients
export const emitOrderBookUpdate = async (matchData = null) => {
  try {
    const stocksResult = await getAllStocksWithLatestPricesService();
    const orderBook = OrderBook.getInstance();
    const buyOrders = orderBook.limitBuyOrderQueue || [];
    const sellOrders = orderBook.limitSellOrderQueue || [];
    const recentTransactions = orderBook.recentTransactions || {};
    
    // If matchData is provided, update the recentTransactions for the matched stock
    if (matchData) {
      const { stockId, price, volume, buyerUserId, sellerUserId } = matchData;
      recentTransactions[stockId] = { 
        price, 
        volume, 
        timestamp: new Date(),
        buyerUserId,
        sellerUserId
      };
      
      // Log that a match happened and we're broadcasting it
      console.log(`[SSE] Broadcasting match event for stock ${stockId}: ${price} x ${volume}`);
    }
    
    const processedData = processOrderBookData(stocksResult, buyOrders, sellOrders, recentTransactions);
    
    // Check the number of connected clients and log it
    console.log(`[SSE] Broadcasting update to ${sseClients.size} connected clients`);
    
    // Force the broadcast as a high-priority update if there was a match
    if (matchData) {
      orderBookEmitter.emit('update', processedData);
      
      // Add a small delay and send another update to ensure all clients receive it
      setTimeout(() => {
        orderBookEmitter.emit('update', processedData);
        console.log(`[SSE] Sent follow-up broadcast for match event`);
      }, 300);
    } else {
      orderBookEmitter.emit('update', processedData);
    }
  } catch (error) {
    console.error('Error emitting order book update:', error);
  }
};

// Controller to get the order book data
export const getOrderBook = async (req, res) => {
  try {
    const stocksResult = await getAllStocksWithLatestPricesService();
    const orderBook = OrderBook.getInstance();
    
    const buyOrders = orderBook.limitBuyOrderQueue || [];
    const sellOrders = orderBook.limitSellOrderQueue || [];
    const recentTransactions = orderBook.recentTransactions || {};
    
    const processedData = processOrderBookData(stocksResult, buyOrders, sellOrders, recentTransactions);
    res.status(200).json(processedData);
  } catch (error) {
    console.error('Error fetching order book data:', error);
    res.status(500).json({ message: 'Failed to fetch order book data' });
  }
};

// Process order book data for frontend display
const processOrderBookData = (stocks, buyOrders, sellOrders, recentTransactions) => {
  // If there are no stocks provided, return an empty array
  if (!stocks || !stocks.length) {
    return [];
  }

  // Process data for each stock
  return stocks.map(stock => {
    // Helper function to aggregate and get top 2 orders
    const getTopAggregatedOrders = (orders, isBuyOrder) => {
      const aggregated = {};
      orders.forEach(order => {
        if (!order.price) return;
        const price = Number(order.price);
        const volume = Number(order.volume);
        if (!aggregated[price]) {
          aggregated[price] = 0;
        }
        aggregated[price] += volume;
      });

      const sorted = Object.entries(aggregated)
        .map(([price, volume]) => ({ price: Number(price), volume }))
        .sort((a, b) => isBuyOrder ? b.price - a.price : a.price - b.price);

      return {
        prc1: sorted[0]?.price || 0,
        vol1: sorted[0]?.volume || 0,
        prc2: sorted[1]?.price || 0,
        vol2: sorted[1]?.volume || 0,
      };
    };

    // Filter and aggregate bid orders for this stock
    const stockBuyOrders = buyOrders.filter(order => order.stockId === stock.stock_id);
    const topBids = getTopAggregatedOrders(stockBuyOrders, true);
      
    // Filter and aggregate ask orders for this stock
    const stockSellOrders = sellOrders.filter(order => order.stockId === stock.stock_id);
    const topAsks = getTopAggregatedOrders(stockSellOrders, false);

    // Get recent transaction for this stock
    const transaction = recentTransactions[stock.stock_id];

    // Format data for frontend
    return {
      symbol: stock.symbol,
      company_name: stock.company_name,
      ref: stock.reference_price || 0,
      bid_prc1: topBids.prc1,
      bid_vol1: topBids.vol1,
      bid_prc2: topBids.prc2,
      bid_vol2: topBids.vol2,
      ask_prc1: topAsks.prc1,
      ask_vol1: topAsks.vol1,
      ask_prc2: topAsks.prc2,
      ask_vol2: topAsks.vol2,
      match_prc: transaction?.price || 0,
      match_vol: transaction?.volume || 0,
      match_timestamp: transaction?.timestamp || null,
      match_notification: transaction ? {
        price: transaction.price,
        volume: transaction.volume,
        timestamp: transaction.timestamp,
        buyerUserId: transaction.buyerUserId,
        sellerUserId: transaction.sellerUserId
      } : null
    };
  });
};