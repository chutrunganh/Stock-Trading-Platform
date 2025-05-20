import React, { useState, useEffect, memo, useMemo } from 'react';
import './Tables.css';
import { 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TablePagination, 
  TableRow,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { getOrderBookData, createOrderBookStream } from '../../../api/orderBook';

// Color constants
const COLORS = {
  DEFAULT: '#000000',
  UP: 'green',
  DOWN: 'red',
  FLOOR: '#006fff',
  CEILING: '#FF00FF',
  REF: '#FFA33E'
};

// Column factory functions
const createPriceColumn = (id, label) => ({
  id,
  label,
  minWidth: 50,
  align: 'center',
  format: (value) => value.toFixed(2)
});

const createVolumeColumn = (id, label) => ({
  id,
  label,
  minWidth: 70,
  align: 'center',
  format: (value) => value.toLocaleString('en-US')
});

// Column definitions
const columns = [
  { id: 'Symbol', label: 'Symbol', minWidth: 100 },
  createPriceColumn('ref', 'Ref'),
  createPriceColumn('ceil', 'Ceil'),
  createPriceColumn('floor', 'Floor'),
  createPriceColumn('bid_prc2', 'Prc\u00a02'),
  createVolumeColumn('bid_vol2', 'Vol\u00a02'),
  createPriceColumn('bid_prc1', 'Prc\u00a01'),
  createVolumeColumn('bid_vol1', 'Vol\u00a01'),
  createPriceColumn('match_prc', 'Match'),
  createVolumeColumn('match_vol', 'Vol'),
  createPriceColumn('ask_prc1', 'Prc\u00a01'),
  createVolumeColumn('ask_vol1', 'Vol\u00a01'),
  createPriceColumn('ask_prc2', 'Prc\u00a02'),
  createVolumeColumn('ask_vol2', 'Vol\u00a02'),
];

// Helper function to get color based on price comparison
const compareRefAndPrice = (ref, price, floor, ceil) => {
  if (!price || price === 0) return COLORS.DEFAULT;
  if (price >= ceil) return COLORS.CEILING;
  if (price <= floor) return COLORS.FLOOR;
  return price > ref ? COLORS.UP : COLORS.DOWN;
};

// Helper function to determine cell text color based on price changes
const getCellTextColor = (columnId, value, floor, ceil, ref, match_prc, row) => {
  // Static column colors
  const staticColors = {
    Symbol: match_prc === 0 ? COLORS.DEFAULT : match_prc > ref ? COLORS.UP : match_prc < ref ? COLORS.DOWN : COLORS.DEFAULT,
    ref: COLORS.REF,
    ceil: COLORS.CEILING,
    floor: COLORS.FLOOR
  };
  
  if (staticColors[columnId]) return staticColors[columnId];

  // Price and volume columns
  const priceMap = {
    'bid_prc1': row.bid_prc1, 'bid_vol1': row.bid_prc1,
    'bid_prc2': row.bid_prc2, 'bid_vol2': row.bid_prc2,
    'ask_prc1': row.ask_prc1, 'ask_vol1': row.ask_prc1,
    'ask_prc2': row.ask_prc2, 'ask_vol2': row.ask_prc2,
    'match_prc': row.match_prc, 'match_vol': row.match_prc
  };

  // For match price and volume, check if it's a recent match
  if (columnId === 'match_prc' || columnId === 'match_vol') {
    const isRecentMatch = row.match_timestamp && 
      (new Date() - new Date(row.match_timestamp)) < 5000; // Highlight for 5 seconds
    if (isRecentMatch) {
      return COLORS.UP; // Highlight recent matches
    }
  }

  return priceMap[columnId] ? compareRefAndPrice(ref, priceMap[columnId], floor, ceil) : 'inherit';
};


// Table header component
const OrderBookTableHeader = () => (
  <TableHead>
    <TableRow>
      <TableCell rowSpan={2} style={{ minWidth: '100px', textAlign: 'center', borderRight: '3px solid #000' }}>Symbol</TableCell>
      <TableCell rowSpan={2} style={{ minWidth: '50px', textAlign: 'center', borderRight: '1px solid #ccc' }}>Ref</TableCell>
      <TableCell rowSpan={2} style={{ minWidth: '50px', textAlign: 'center', borderRight: '1px solid #ccc' }}>Ceil</TableCell>
      <TableCell rowSpan={2} style={{ minWidth: '50px', textAlign: 'center', borderRight: '3px solid #000' }}>Floor</TableCell>
      <TableCell colSpan={4} align="center" style={{ borderRight: '3px solid #000' }}>Bid</TableCell>
      <TableCell colSpan={2} align="center" className="match-header" style={{ borderRight: '3px solid #000' }}>Match</TableCell>
      <TableCell colSpan={4} align="center">Ask</TableCell>
    </TableRow>
    <TableRow>
      {columns.slice(4).map((column) => {
        const isMatchColumn = column.id === 'match_prc' || column.id === 'match_vol';
        return (
          <TableCell
            key={column.id}
            align={column.align}
            className={isMatchColumn ? 'match-header' : ''}
            style={{
              minWidth: column.minWidth,
              paddingLeft: '16px',
              paddingRight: '16px',
              borderRight: ['bid_vol1', 'match_vol', 'ask_vol2'].includes(column.id) ? '3px solid #000' : '1px solid #ccc',
            }}
          >
            {column.label}
          </TableCell>
        );
      })}
    </TableRow>
  </TableHead>
);

// Memoized row component for performance
const OrderBookTableRow = memo(({ row, columns, onRowClick, selectedSymbol }) => {
  return (
    <TableRow 
      hover 
      tabIndex={-1} 
      onClick={() => onRowClick?.(row)}
      sx={{ cursor: 'pointer', backgroundColor: row.Symbol === selectedSymbol ? 'rgba(240, 164, 0, 0.1)' : 'inherit' }}
    >
      {columns.map(({ id, align, format }) => {
        const value = row[id];
        const isSymbolColumn = id === 'Symbol';
        const isPriceCell = id.includes('prc') || id === 'match_prc' || id === 'ref' || id === 'ceil' || id === 'floor';
        const isVolumeCell = id.includes('vol');
        const isMatchPrice = id === 'match_prc';
        const isMatchVolume = id === 'match_vol';
        const isMatchColumn = isMatchPrice || isMatchVolume;
        const borderRightStyle = ['Symbol', 'floor', 'bid_vol1', 'match_vol', 'ask_vol2'].includes(id)
          ? '3px solid #000'
          : '1px solid #ccc';

        return (
          <TableCell
            key={id}
            align={align}
            data-price-cell={isPriceCell ? "true" : "false"}
            data-volume-cell={isVolumeCell ? "true" : "false"}
            data-match-price={isMatchPrice ? "true" : "false"}
            className={isMatchColumn ? 'match-column' : ''}
            sx={{
              fontWeight: isSymbolColumn ? 'bold' : 'normal',
              color: getCellTextColor(id, value, row.floor, row.ceil, row.ref, row.match_prc, row),
              borderRight: borderRightStyle,
              padding: '8px 16px',
            }}
          >
            {format && typeof value === 'number' ? format(value) : value}
          </TableCell>
        );
      })}
    </TableRow>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the relevant data has changed
  const { row: prevRow, selectedSymbol: prevSelected } = prevProps;
  const { row: nextRow, selectedSymbol: nextSelected } = nextProps;

  if (prevRow.Symbol !== nextRow.Symbol || prevSelected !== nextSelected) return false;

  const fieldsToCompare = [
    'bid_prc1', 'bid_vol1', 'bid_prc2', 'bid_vol2',
    'ask_prc1', 'ask_vol1', 'ask_prc2', 'ask_vol2',
    'match_prc', 'match_vol'
  ];

  return !fieldsToCompare.some(field => prevRow[field] !== nextRow[field]);
});

function Tables({ onStockSelect = () => {}, selectedSymbol = null }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBookData, setOrderBookData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [notification, setNotification] = useState(null);

  // Helper function to check if a notification has been shown
  const hasNotificationBeenShown = (stockSymbol, timestamp) => {
    const shownNotifications = JSON.parse(localStorage.getItem('shownNotifications') || '{}');
    return shownNotifications[stockSymbol] === timestamp;
  };

  // Helper function to mark a notification as shown
  const markNotificationAsShown = (stockSymbol, timestamp) => {
    const shownNotifications = JSON.parse(localStorage.getItem('shownNotifications') || '{}');
    shownNotifications[stockSymbol] = timestamp;
    localStorage.setItem('shownNotifications', JSON.stringify(shownNotifications));
  };

  // Transform orderBookData into the format expected by the table
  const processedRows = useMemo(() => {
    if (!Array.isArray(orderBookData) || orderBookData.length === 0) {
      return [];
    }

    return orderBookData.map(stockData => {
      console.log('Data received from backend:', stockData); // Log the raw data
      
      // Convert all values to numbers and handle null/undefined
      const refPrice = Number(stockData.ref) || 0;
      const ceilPrice = Math.round(refPrice * 1.07 * 100) / 100;
      const floorPrice = Math.round(refPrice * 0.93 * 100) / 100;
      
      // Extract bid and ask data directly
      const bid_prc1 = Number(stockData.bid_prc1) || 0;
      const bid_vol1 = Number(stockData.bid_vol1) || 0;
      const bid_prc2 = Number(stockData.bid_prc2) || 0;
      const bid_vol2 = Number(stockData.bid_vol2) || 0;
      
      const ask_prc1 = Number(stockData.ask_prc1) || 0;
      const ask_vol1 = Number(stockData.ask_vol1) || 0;
      const ask_prc2 = Number(stockData.ask_prc2) || 0;
      const ask_vol2 = Number(stockData.ask_vol2) || 0;
      
      // Extract match data
      const match_prc = Number(stockData.match_prc) || 0;
      const match_vol = Number(stockData.match_vol) || 0;
      const match_timestamp = stockData.match_timestamp || null;
      
      // Create the row data object (no frontend aggregation needed)
      const finalData = {
        id: stockData.stock_id || stockData.id, // Support both field names
        stock_id: stockData.stock_id || stockData.id, // Support both field names
        Symbol: stockData.symbol,
        ref: refPrice,
        ceil: ceilPrice,
        floor: floorPrice,
        bid_prc1: bid_prc1,
        bid_vol1: bid_vol1,
        bid_prc2: bid_prc2,
        bid_vol2: bid_vol2,
        match_prc: match_prc,
        match_vol: match_vol,
        ask_prc1: ask_prc1,
        ask_vol1: ask_vol1,
        ask_prc2: ask_prc2,
        ask_vol2: ask_vol2,
        match_timestamp: match_timestamp
      };

      console.log('Final data for UI row:', finalData); // Log the data being passed to the UI
      return finalData;
    });
  }, [orderBookData, lastUpdateTime]);

  // Improve SSE connection handling
  useEffect(() => {
    let eventSource = null;
    let retryCount = 0;
    let retryTimeout = null;
    const maxRetries = 3;
    let pollInterval = null;
    
    // Load initial data and set up polling
    const loadInitialData = async () => {
      try {
        console.log('[Sync] Fetching order book data');
        setLoading(true);
        const data = await getOrderBookData();
        if (data && Array.isArray(data)) {
          console.log('[Sync] Received order book data with', data.length, 'items');
          setOrderBookData(data);
          setLastUpdateTime(new Date());
          setError(null);
        }
        setLoading(false);
      } catch (error) {
        console.error('[Sync] Error loading order book data:', error);
        setError('Failed to load order book data. Please try again later.');
        setLoading(false);
      }
    };
    
    // Set up polling for data freshness
    const setupPolling = () => {
      // Clear any existing poll interval
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      
      // Poll every 2 seconds to ensure data is fresh
      pollInterval = setInterval(async () => {
        try {
          console.log('[Sync] Polling for fresh data');
          const freshData = await getOrderBookData();
          if (freshData && Array.isArray(freshData)) {
            // Check if there are any differences between current and fresh data
            const hasChanges = JSON.stringify(freshData) !== JSON.stringify(orderBookData);
            
            if (hasChanges) {
              console.log('[Sync] Detected changes in polled data, updating UI');
              setOrderBookData(freshData);
              setLastUpdateTime(new Date());
            } else {
              console.log('[Sync] No changes detected in polled data');
            }
          }
        } catch (error) {
          console.error('[Sync] Error during polling:', error);
        }
      }, 2000); // Poll every 2 seconds
    };
    
    // Initialize SSE connection with better error handling and reconnection
    const initSSEConnection = () => {
      if (eventSource) {
        eventSource.close();
      }
      
      eventSource = createOrderBookStream();
      
      // Track last received message time to detect stalled connections
      let lastMessageTime = Date.now();
      const connectionMonitor = setInterval(() => {
        // If no message received for 2 minutes, reconnect
        if (Date.now() - lastMessageTime > 120000) {
          console.log('[SSE] Connection appears stalled, reconnecting...');
          clearInterval(connectionMonitor);
          eventSource.close();
          initSSEConnection();
        }
      }, 60000);
      
      eventSource.onopen = () => {
        console.log('[SSE] Connection established');
        retryCount = 0;
        setError(null);
      };
      
      eventSource.onmessage = (event) => {
        // Update last message time
        lastMessageTime = Date.now();
        
        try {
          const { type, data, timestamp } = JSON.parse(event.data);
          
          // Handle heartbeat
          if (type === 'heartbeat') {
            console.log(`[SSE] Received heartbeat: ${timestamp}`);
            return;
          }
          
          console.log(`[SSE] Received ${type} event with ${data?.length || 0} items`);
          
          if ((type === 'initial' || type === 'update') && Array.isArray(data)) {
            // Check if any stock has a match
            const hasMatchUpdate = data.some(stock => 
              stock.match_prc > 0 && stock.match_vol > 0 && stock.match_timestamp
            );
            
            if (hasMatchUpdate) {
              console.log('[SSE] Received data with match updates:', 
                data.filter(s => s.match_prc > 0).map(s => ({
                  symbol: s.symbol,
                  match_price: s.match_prc,
                  match_volume: s.match_vol,
                  timestamp: s.match_timestamp
                }))
              );
            }
            
            // Process notifications
            data.forEach(stock => {
              if (stock.match_notification) {
                const currentUserId = localStorage.getItem('userId');
                const matchTimestamp = stock.match_notification.timestamp;
                
                // Debug logging
                console.log('[Notification] Processing match notification:', {
                  symbol: stock.symbol,
                  buyerUserId: stock.match_notification.buyerUserId,
                  sellerUserId: stock.match_notification.sellerUserId,
                  currentUserId,
                  timestamp: matchTimestamp
                });
                
                if (!hasNotificationBeenShown(stock.symbol, matchTimestamp)) {
                  if (currentUserId) {
                    // Convert to strings for comparison to handle string vs number IDs
                    const isBuyer = String(stock.match_notification.buyerUserId) === String(currentUserId);
                    const isSeller = String(stock.match_notification.sellerUserId) === String(currentUserId);

                    if (isBuyer || isSeller) {
                      setNotification({
                        type: 'success',
                        message: `Your ${isBuyer ? 'buy' : 'sell'} order for ${stock.symbol} was matched! Price: ${stock.match_notification.price}, Volume: ${stock.match_notification.volume}`
                      });
                      markNotificationAsShown(stock.symbol, matchTimestamp);
                    }
                  }
                }
              }
            });

            // Update order book data immediately for matches, with short debounce for other updates
            if (hasMatchUpdate) {
              console.log('[SSE] Updating UI immediately for match event');
              setOrderBookData(data);
              setLastUpdateTime(new Date());
              setLoading(false);
            } else {
              const timeoutId = setTimeout(() => {
                setOrderBookData(data);
                setLastUpdateTime(new Date());
                setLoading(false);
              }, 100);
              return () => clearTimeout(timeoutId);
            }
          }
        } catch (error) {
          console.error('[SSE] Error processing message:', error);
        }
      };
      
      eventSource.onerror = (e) => {
        console.error('[SSE] Connection error:', e);
        clearInterval(connectionMonitor);
        eventSource.close();
        
        if (retryCount < maxRetries) {
          retryCount++;
          const retryDelay = 2000 * retryCount;
          console.log(`[SSE] Retrying connection in ${retryDelay}ms (attempt ${retryCount}/${maxRetries})`);
          
          loadInitialData();
          retryTimeout = setTimeout(initSSEConnection, retryDelay);
        } else {
          setError('Real-time updates unavailable. Data may not be current.');
        }
      };
      
      return connectionMonitor;
    };
    
    // Initialize components
    loadInitialData();
    const connectionMonitor = initSSEConnection();
    setupPolling();
    
    // Cleanup
    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (connectionMonitor) {
        clearInterval(connectionMonitor);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  // Handle notification close
  const handleNotificationClose = () => {
    setNotification(null);
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle row click with null check
  const handleRowClick = (row) => {
    if (typeof onStockSelect === 'function') {
      onStockSelect(row);
    }
  };

  // Display loading state or error
  if (loading) {
    return (
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <CircularProgress />
        </div>
      </Paper>
    );
  }
  // Function to reset the component state and force a refresh
  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // This will trigger the useEffect to run again
    window.location.reload();
  };

  if (error) {
    return (
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ color: 'red', marginBottom: '15px' }}>
            {error}
          </div>
          <button 
            onClick={handleRetry}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Retry Connection
          </button>
        </div>
      </Paper>
    );
  }

  // Calculate paginated rows
  const paginatedRows = processedRows.slice(
    page * rowsPerPage, 
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 1000 }}>
        <Table stickyHeader aria-label="order book table">
          <OrderBookTableHeader />
          <TableBody sx={{ borderBottom: '1px solid #ccc' }}>
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row) => (
                <OrderBookTableRow 
                  key={row.Symbol} 
                  row={row} 
                  columns={columns} 
                  onRowClick={handleRowClick}
                  selectedSymbol={selectedSymbol}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} style={{ textAlign: 'center', padding: '20px' }}>
                  No order book data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10]} 
        component="div"
        count={processedRows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleNotificationClose} 
          severity={notification?.type || 'info'}
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

export default Tables;