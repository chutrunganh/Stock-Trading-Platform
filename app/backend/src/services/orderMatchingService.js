import { settleMatchedOrder } from './orderSettlementService.js';
import { emitOrderBookUpdate } from '../controllers/orderBookController.js';

// Order Matching Service
// This service is responsible for matching buy and sell orders based on price and time priority.
export class OrderBook {
  constructor() {

    // Only market order needs to use queue for matching
    // Market orders are executed immediately and do not need to be queued
    this.limitBuyOrderQueue = [];
    this.limitSellOrderQueue = [];
    
    // Store recent transactions for display purposes
    this.recentTransactions = {};
  }

  // Singleton pattern to ensure only one instance of OrderBook exists
  // This instance will be shared across all order CRUD operations
  static getInstance() {
    if (!OrderBook.instance) {
      OrderBook.instance = new OrderBook();
    }
    return OrderBook.instance;
  }

  clearOrderBook() {
    this.limitBuyOrderQueue = [];
    this.limitSellOrderQueue = [];
    this.recentTransactions = {};
  }

  // --- Market Order Matching ---
  // Match market orders with the best available limit orders
  async marketOrderMatching(order) {
    if (order.type === "Market Buy") {
      // Filter sell orders for the specific stock and keep them sorted by price (lowest first)
      const relevantSellOrders = this.limitSellOrderQueue.filter(
        so => so.stockId === order.stockId
      );
      // The global queue is already sorted by price (a.price - b.price),
      // so filtering maintains this order for the specific stock.

      let sellOrderIndex = 0;
      while (order.volume > 0 && sellOrderIndex < relevantSellOrders.length) {
        const sellOrder = relevantSellOrders[sellOrderIndex]; // Best-priced sell order for THIS stock

        const matchedQuantity = Math.min(order.volume, sellOrder.volume);
        const matchedPrice = sellOrder.price; // Price from sellOrder of the same stock

        // Update volumes
        order.volume -= matchedQuantity;
        sellOrder.volume -= matchedQuantity; // This modifies the actual order object

        // Settle the matched order
        await settleMatchedOrder({
          buyerPortfolioId: order.portfolioId,
          sellerPortfolioId: sellOrder.portfolioId,
          stockId: order.stockId, // This is the stockId of the incoming market order
          quantity: matchedQuantity,
          price: matchedPrice,    // This is now the price from a sellOrder of the same stock
          matchType: 'market',
          buyerUserId: order.userId,
          sellerUserId: sellOrder.userId
        });

        // Store the transaction for display
        this.recentTransactions[order.stockId] = {
          price: matchedPrice,
          volume: matchedQuantity,
          timestamp: new Date(),
          buyerUserId: order.userId,
          sellerUserId: sellOrder.userId
        };

        // Remove completed sell order from the original global queue
        if (sellOrder.volume === 0) {
          this.limitSellOrderQueue = this.limitSellOrderQueue.filter(o => o.id !== sellOrder.id);
          // No need to increment sellOrderIndex here as the relevantSellOrders array is not modified in place for the loop
          // but we should effectively process the "next" one if we were iterating over a live-modified list.
          // Since relevantSellOrders is a snapshot, we just let the loop pick the next after this one.
          // However, to be safe and simple, if we remove, we might re-filter or adjust index.
          // A simpler way is to remove from global and then the loop continues on static relevantSellOrders
          // and if sellOrder.volume became 0, it won't be picked again if it was still in relevantSellOrders.
          // The current logic is that sellOrder object's volume is updated.
          // If it's 0, we remove it from global. The local relevantSellOrders still has it but its volume is 0.
          // It's better to also remove/skip from relevantSellOrders.
          relevantSellOrders.splice(sellOrderIndex, 1); // Remove from the temporary filtered list
          // Do not increment sellOrderIndex because splice shifts elements
        } else {
          sellOrderIndex++; // Move to the next relevant sell order
        }
      }

    } else if (order.type === "Market Sell") {
      // Filter buy orders for the specific stock and keep them sorted by price (highest first)
      const relevantBuyOrders = this.limitBuyOrderQueue.filter(
        bo => bo.stockId === order.stockId
      );
      // The global queue is sorted by price (b.price - a.price for buys),
      // filtering maintains this order for the specific stock.
      
      let buyOrderIndex = 0;
      while (order.volume > 0 && buyOrderIndex < relevantBuyOrders.length) {
        const buyOrder = relevantBuyOrders[buyOrderIndex]; // Best-priced buy order for THIS stock

        const matchedQuantity = Math.min(order.volume, buyOrder.volume);
        const matchedPrice = buyOrder.price; // Price from buyOrder of the same stock

        // Update volumes
        order.volume -= matchedQuantity;
        buyOrder.volume -= matchedQuantity; // Modifies the actual order object

        // Settle the matched order
        await settleMatchedOrder({
          buyerPortfolioId: buyOrder.portfolioId,
          sellerPortfolioId: order.portfolioId,
          stockId: order.stockId,
          quantity: matchedQuantity,
          price: matchedPrice, // Price from buyOrder of the same stock
          matchType: 'market',
          buyerUserId: buyOrder.userId,
          sellerUserId: order.userId
        });

        // Store the transaction for display
        this.recentTransactions[order.stockId] = {
          price: matchedPrice,
          volume: matchedQuantity,
          timestamp: new Date(),
          buyerUserId: buyOrder.userId,
          sellerUserId: order.userId
        };

        // Remove completed buy order from the original global queue
        if (buyOrder.volume === 0) {
          this.limitBuyOrderQueue = this.limitBuyOrderQueue.filter(o => o.id !== buyOrder.id);
          relevantBuyOrders.splice(buyOrderIndex, 1); // Remove from the temporary filtered list
          // Do not increment buyOrderIndex
        } else {
          buyOrderIndex++; // Move to the next relevant buy order
        }
      }
    }
  }

  // --- Limit Order Matching ---
  // Push orders into the appropriate queue with piority based on price and timestamp
  addOrderToQuene(order) {
    if (order.type === "Limit Buy") {
      this.limitBuyOrderQueue.push(order);
      this.limitBuyOrderQueue.sort((a, b) => b.price - a.price || a.timestamp - b.timestamp);
    } else if (order.type === "Limit Sell") {
      this.limitSellOrderQueue.push(order);
      this.limitSellOrderQueue.sort((a, b) => a.price - b.price || a.timestamp - b.timestamp);
    }
  }

  // Handle limit order matching
  async limitOrderMatching(order) {
    // Add the order to the appropriate queue
    this.addOrderToQuene(order);

    console.log(`[Order] Processing ${order.type} order for stock ${order.stockId}, price ${order.price}, volume ${order.volume}`);

    // Try to match the order immediately
    if (order.type === "Limit Buy") {
      let matchOccurred = false;
      const relevantSellOrders = this.limitSellOrderQueue.filter(
        so => so.stockId === order.stockId
      ); // Filter for the same stock

      let sellOrderIndex = 0;
      while (sellOrderIndex < relevantSellOrders.length && order.volume > 0) {
        const sellOrder = relevantSellOrders[sellOrderIndex];
        if (order.price >= sellOrder.price) { // Price condition for limit buy
          const matchedQuantity = Math.min(order.volume, sellOrder.volume);
          const matchedPrice = sellOrder.price; // Matched at the sell order's price

          console.log(`[Match] Buy match found: ${matchedQuantity} @ ${matchedPrice} (Stock ${order.stockId})`);
          matchOccurred = true;

          // Update volumes
          order.volume -= matchedQuantity;
          sellOrder.volume -= matchedQuantity;

          // Settle the matched order
          await settleMatchedOrder({
            buyerPortfolioId: order.portfolioId,
            sellerPortfolioId: sellOrder.portfolioId,
            stockId: order.stockId,
            quantity: matchedQuantity,
            price: matchedPrice, // Use sellOrder's price
            matchType: 'limit',
            buyerUserId: order.userId,
            sellerUserId: sellOrder.userId
          });

          // Store the transaction for display with ISO timestamp
          this.recentTransactions[order.stockId] = {
            price: matchedPrice,
            volume: matchedQuantity,
            timestamp: new Date().toISOString(),
            buyerUserId: order.userId,
            sellerUserId: sellOrder.userId
          };

          // Emit update with match data
          await emitOrderBookUpdate({
            stockId: order.stockId,
            price: matchedPrice,
            volume: matchedQuantity,
            buyerUserId: order.userId,
            sellerUserId: sellOrder.userId
          });

          // Remove completed sell order from global queue
          if (sellOrder.volume === 0) {
            this.limitSellOrderQueue = this.limitSellOrderQueue.filter(o => o.id !== sellOrder.id);
            relevantSellOrders.splice(sellOrderIndex, 1);
            // Do not increment index
          } else {
            sellOrderIndex++;
          }

          // If buy order is filled, remove it from queue
          if (order.volume === 0) {
            this.limitBuyOrderQueue = this.limitBuyOrderQueue.filter(o => o.id !== order.id);
            break; 
          }
        } else {
          // Sell order price is too high, no more matches possible for this buy order against sorted sell orders
          break;
        }
      }
      
      if (!matchOccurred && order.volume > 0) { // if order still has volume and no match, it was added to queue earlier
        console.log(`[Order] No immediate match found for buy order ${order.id}, emitting update for new order in book`);
        await emitOrderBookUpdate();
      } else if (matchOccurred && order.volume === 0) {
         console.log(`[Order] Buy order ${order.id} fully matched and filled.`);
      } else if (matchOccurred && order.volume > 0) {
         console.log(`[Order] Buy order ${order.id} partially matched, remaining volume added to book.`);
         // Order was already added by addOrderToQuene, its volume is now updated.
         await emitOrderBookUpdate();
      }

    } else if (order.type === "Limit Sell") {
      let matchOccurred = false;
      const relevantBuyOrders = this.limitBuyOrderQueue.filter(
        bo => bo.stockId === order.stockId
      ); // Filter for the same stock

      let buyOrderIndex = 0;
      while (buyOrderIndex < relevantBuyOrders.length && order.volume > 0) {
        const buyOrder = relevantBuyOrders[buyOrderIndex];
        if (buyOrder.price >= order.price) { // Price condition for limit sell
          const matchedQuantity = Math.min(order.volume, buyOrder.volume);
          const matchedPrice = buyOrder.price; // Matched at the buy order's price

          console.log(`[Match] Sell match found: ${matchedQuantity} @ ${matchedPrice} (Stock ${order.stockId})`);
          matchOccurred = true;

          // Update volumes
          order.volume -= matchedQuantity;
          buyOrder.volume -= matchedQuantity;

          // Settle the matched order
          await settleMatchedOrder({
            buyerPortfolioId: buyOrder.portfolioId,
            sellerPortfolioId: order.portfolioId,
            stockId: order.stockId,
            quantity: matchedQuantity,
            price: matchedPrice, // Use buyOrder's price
            matchType: 'limit',
            buyerUserId: buyOrder.userId,
            sellerUserId: order.userId
          });

          // Store the transaction for display with ISO timestamp
          this.recentTransactions[order.stockId] = {
            price: matchedPrice,
            volume: matchedQuantity,
            timestamp: new Date().toISOString(),
            buyerUserId: buyOrder.userId,
            sellerUserId: order.userId
          };

          // Emit update with match data
          await emitOrderBookUpdate({
            stockId: order.stockId,
            price: matchedPrice,
            volume: matchedQuantity,
            buyerUserId: buyOrder.userId,
            sellerUserId: order.userId
          });

          // Remove completed buy order from global queue
          if (buyOrder.volume === 0) {
            this.limitBuyOrderQueue = this.limitBuyOrderQueue.filter(o => o.id !== buyOrder.id);
            relevantBuyOrders.splice(buyOrderIndex, 1);
            // Do not increment index
          } else {
            buyOrderIndex++;
          }

          // If sell order is filled, remove it from queue
          if (order.volume === 0) {
            this.limitSellOrderQueue = this.limitSellOrderQueue.filter(o => o.id !== order.id);
            break;
          }
        } else {
          // Buy order price is too low, no more matches possible for this sell order against sorted buy orders
          break;
        }
      }

      if (!matchOccurred && order.volume > 0) { // if order still has volume and no match
        console.log(`[Order] No immediate match found for sell order ${order.id}, emitting update for new order in book`);
        await emitOrderBookUpdate();
      } else if (matchOccurred && order.volume === 0) {
         console.log(`[Order] Sell order ${order.id} fully matched and filled.`);
      } else if (matchOccurred && order.volume > 0) {
         console.log(`[Order] Sell order ${order.id} partially matched, remaining volume added to book.`);
         await emitOrderBookUpdate();
      }
    }
  }

  // Match orders
  matchOrders() {
    while (this.limitBuyOrderQueue.length > 0 && this.limitSellOrderQueue.length > 0) {
      const buyOrder = this.limitBuyOrderQueue[0];
      const sellOrder = this.limitSellOrderQueue[0];

      if (buyOrder.price >= sellOrder.price) {
        // Match found
        const matchQuantity = Math.min(buyOrder.volume, sellOrder.volume);
        const matchPrice = sellOrder.price;

        // Update order volumes
        buyOrder.volume -= matchQuantity;
        sellOrder.volume -= matchQuantity;

        // Remove filled orders
        if (buyOrder.volume === 0) {
          this.limitBuyOrderQueue.shift();
        }
        if (sellOrder.volume === 0) {
          this.limitSellOrderQueue.shift();
        }

        // Record the match
        this.recentTransactions[buyOrder.stockId] = {
          price: matchPrice,
          volume: matchQuantity,
          timestamp: new Date(),
          buyerUserId: buyOrder.userId,
          sellerUserId: sellOrder.userId
        };

        // Emit update with match data
        emitOrderBookUpdate({
          stockId: buyOrder.stockId,
          price: matchPrice,
          volume: matchQuantity,
          buyerUserId: buyOrder.userId,
          sellerUserId: sellOrder.userId
        });

        // Process the match (update holdings, etc.)
        this.processMatch(buyOrder, sellOrder, matchQuantity, matchPrice);
      } else {
        // No more matches possible
        break;
      }
    }
  }

  // Remove orders from the queues (e.g., when they are canceled an order)
  // Only limit order can be canceled, market orders are executed immediatelyso they cannot be canceled
  removeOrderFromQuene(orderId) {
    this.limitBuyOrderQueue = this.limitBuyOrderQueue.filter(order => order.id !== orderId);
    this.limitSellOrderQueue = this.limitSellOrderQueue.filter(order => order.id !== orderId);
  }

  // Display the order book in a properly aligned tabular format with full borders
  displayOrderBook() {
    // Group orders by stockId
    const stockGroups = {};

    // Helper function to aggregate orders by price
    // For example, if there are two limit orders: order 1 price 10.00 volume 100 and order 2 price 10.00 volume 50,
    // then the table should be updated to show one entry price 10.00 150 instead of two entries 10.00 100 10.00 50 
    const aggregateOrders = (orders, isBuyOrder) => {
      const aggregated = {};
      orders.forEach(order => {
        const price = order.price;
        if (!aggregated[price]) {
          aggregated[price] = { price, volume: 0 };
        }
        aggregated[price].volume += order.volume;
      });
      // Sort buy orders high to low, sell orders low to high
      return Object.values(aggregated).sort((a, b) => 
        isBuyOrder ? b.price - a.price : a.price - b.price
      );
    };

    // Process buy orders
    this.limitBuyOrderQueue.forEach(order => {
      if (!stockGroups[order.stockId]) {
        stockGroups[order.stockId] = {
          bids: [],
          asks: []
        };
      }
      stockGroups[order.stockId].bids = aggregateOrders(
        this.limitBuyOrderQueue.filter(o => o.stockId === order.stockId),
        true
      );
    });

    // Process sell orders
    this.limitSellOrderQueue.forEach(order => {
      if (!stockGroups[order.stockId]) {
        stockGroups[order.stockId] = {
          bids: [],
          asks: []
        };
      }
      stockGroups[order.stockId].asks = aggregateOrders(
        this.limitSellOrderQueue.filter(o => o.stockId === order.stockId),
        false
      );
    });

    // Display the order book for each stock
    console.log('\n');
    console.log('╔════════════╦═══════════════════════════════════════╦════════════════════╦═══════════════════════════════════════╗');
    console.log('║ Stock ID   ║                   Bid                 ║       Matched      ║               Ask                     ║');
    console.log('║            ╠═══════════╦═══════╦═══════════╦═══════╬═══════════╦════════╬═══════════╦═══════╬═══════════╦═══════╣');
    console.log('║            ║   Prc 2   ║ Vol 2 ║   Prc 1   ║ Vol 1 ║    Prc    ║  Vol   ║   Prc 1   ║ Vol 1 ║   Prc 2   ║ Vol 2 ║');
    console.log('╠════════════╬═══════════╬═══════╬═══════════╬═══════╬═══════════╬════════╬═══════════╬═══════╬═══════════╬═══════╣');

    Object.keys(stockGroups).forEach(stockId => {
      const group = stockGroups[stockId];
      const topBids = group.bids.slice(0, 2);
      const topAsks = group.asks.slice(0, 2);
      
      let matchedVolume = null;
      let matchedPrice = null;
      
      if (this.recentTransactions[stockId]) {
        matchedPrice = this.recentTransactions[stockId].price;
        matchedVolume = this.recentTransactions[stockId].volume;
      }

      console.log(
        `║ ${stockId.padEnd(10)} ║ ${
          topBids[1] ? topBids[1].price.toFixed(2).padStart(9) : '         '} ║ ${
          topBids[1] ? topBids[1].volume.toString().padStart(5) : '     '} ║ ${
          topBids[0] ? topBids[0].price.toFixed(2).padStart(9) : '         '} ║ ${
          topBids[0] ? topBids[0].volume.toString().padStart(5) : '     '} ║ ${
          matchedPrice ? matchedPrice.toFixed(2).padStart(9) : '         '} ║ ${
          matchedVolume ? matchedVolume.toString().padStart(6) : '      '} ║ ${
          topAsks[0] ? topAsks[0].price.toFixed(2).padStart(9) : '         '} ║ ${
          topAsks[0] ? topAsks[0].volume.toString().padStart(5) : '     '} ║ ${
          topAsks[1] ? topAsks[1].price.toFixed(2).padStart(9) : '         '} ║ ${
          topAsks[1] ? topAsks[1].volume.toString().padStart(5) : '     '} ║`
      );
    });

    console.log('╚════════════╩═══════════╩═══════╩═══════════╩═══════╩═══════════╩════════╩═══════════╩═══════╩═══════════╩═══════╝\n');
  }
}