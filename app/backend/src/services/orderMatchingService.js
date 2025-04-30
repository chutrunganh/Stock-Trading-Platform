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

  // --- Market Order Matching ---
  // Match market orders with the best available limit orders
  marketOrderMatching(order) {
    if (order.type === "Market Buy") {
      // Execute immediately with the best available sell prices
      while (order.volume > 0 && this.limitSellOrderQueue.length > 0) {
        const sellOrder = this.limitSellOrderQueue[0];
        const matchedQuantity = Math.min(order.volume, sellOrder.volume);
        const matchedPrice = sellOrder.price;

        // Update volumes
        order.volume -= matchedQuantity;
        sellOrder.volume -= matchedQuantity;

        // Record transaction
        console.log(`Transaction: ${matchedQuantity} shares of stock ${order.stockId} at $${matchedPrice} each`);
        
        // Store the transaction for display
        this.recentTransactions[order.stockId] = {
          price: matchedPrice,
          volume: matchedQuantity,
          timestamp: new Date()
        };

        // Remove completed sell order
        if (sellOrder.volume === 0) {
          this.limitSellOrderQueue.shift();
        }
      }

    } else if (order.type === "Market Sell") {
      // Execute immediately with the best available buy prices
      while (order.volume > 0 && this.limitBuyOrderQueue.length > 0) {
        const buyOrder = this.limitBuyOrderQueue[0];
        const matchedQuantity = Math.min(order.volume, buyOrder.volume);
        const matchedPrice = buyOrder.price;

        // Update volumes
        order.volume -= matchedQuantity;
        buyOrder.volume -= matchedQuantity;

        // Record transaction
        console.log(`Transaction: ${matchedQuantity} shares of stock ${order.stockId} at $${matchedPrice} each`);
        
        // Store the transaction for display
        this.recentTransactions[order.stockId] = {
          price: matchedPrice,
          volume: matchedQuantity,
          timestamp: new Date()
        };

        // Remove completed buy order
        if (buyOrder.volume === 0) {
          this.limitBuyOrderQueue.shift();
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

 limitOrderMatching() {
    while (this.limitBuyOrderQueue.length > 0 && this.limitSellOrderQueue.length > 0) {
      const buyOrder = this.limitBuyOrderQueue[0]; // Highest price buy order
      const sellOrder = this.limitSellOrderQueue[0]; // Lowest price sell order

      // Ensure the stock IDs match before attempting to match orders
      // and check if the buy order price is greater than or equal to the sell order price
      // This is a simplified matching logic; in a real-world scenario, you would also consider order types and other factors, polies
      if (buyOrder.stockId === sellOrder.stockId && buyOrder.price >= sellOrder.price) {
        const matchedQuantity = Math.min(buyOrder.volume, sellOrder.volume);
        const matchedPrice = sellOrder.price;

        // Update volumes
        buyOrder.volume -= matchedQuantity;
        sellOrder.volume -= matchedQuantity;        // Record transaction (simplified for now)
        console.log(`Transaction: ${matchedQuantity} shares of stock ${buyOrder.stockId} at $${matchedPrice} each`);
        
        // Store the transaction for display
        this.recentTransactions[buyOrder.stockId] = {
          price: matchedPrice,
          volume: matchedQuantity,
          timestamp: new Date()
        };

        // Remove completed orders
        if (buyOrder.volume === 0) this.limitBuyOrderQueue.shift();
        if (sellOrder.volume === 0) this.limitSellOrderQueue.shift();
      } else {
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