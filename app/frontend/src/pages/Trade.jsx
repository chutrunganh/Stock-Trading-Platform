import './Trade.css';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createOrder, getMostTradedStocks, getStockBySymbol } from '../api/trade';

const MiniLineChart = ({ data, width = 150, height = 50, strokeColor = '#007bff' }) => {
    if (!data || data.length < 2) {
        return <div style={{ height: `${height}px`, width: `${width}px`, border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>No data</div>;
    }
    const padding = 5;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;
    const points = data.map((value, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((value - minVal) / range) * chartHeight;
        return `${x},${y}`;
    }).join(' ');
    return (
        <svg width={width} height={height} style={{ display: 'block' }}>
            <polyline fill="none" stroke={strokeColor} strokeWidth="1.5" points={points} />
        </svg>
    );
};

const StockCard = ({ stock }) => {
    const isPositive = stock.changePercent >= 0;
    const changeColor = isPositive ? '#28a745' : '#dc3545';

    const getLogo = (ticker) => {
        switch(ticker) {
            case 'AAPL': return <div className="stock-logo apple-logo"></div>;
            case 'NVDA': return <div className="stock-logo nvidia-logo"></div>;
            case 'TSLA': return <div className="stock-logo tesla-logo">T</div>;
            case 'COST': return <div className="stock-logo costco-logo">C</div>;
            case 'NFLX': return <div className="stock-logo netflix-logo">N</div>;
            case 'MSFT': return <div className="stock-logo msft-logo"></div>;
            default: return <div className="stock-logo">{ticker.charAt(0)}</div>;
        }
    }

    return (
        <div className="stock-card">
            <div className="stock-card-header">
                 {getLogo(stock.ticker)}
                <div className="stock-card-ticker-name">
                    <span className="stock-ticker">{stock.ticker} <span className="market-dot">•</span></span>
                    <span className="stock-name">{stock.name}</span>
                </div>
                <span className="stock-card-icon"></span>
            </div>
            <div className="stock-card-price-info">
                <span className="stock-price">${stock.price.toFixed(2)}</span>
                <span className="stock-change" style={{ color: changeColor }}>
                    {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}% ({isPositive ? '+' : ''}{stock.changeValue.toFixed(2)})
                </span>
            </div>
            <div className="stock-chart-container">
                 <MiniLineChart data={stock.chartData} strokeColor={isPositive ? '#007bff' : '#6c757d'} />
            </div>
             <div className="stock-chart-xaxis">
                <span>May</span>
                <span>Aug</span>
                <span>2025</span>
                <span>Apr</span>
            </div>
        </div>
    );
};

const MostTradedStocks = () => {
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStocks = async () => {
            try {
                const stocksData = await getMostTradedStocks();
                setStocks(stocksData);
                setLoading(false);
            } catch (err) {
                setError('Failed to load stocks data');
                setLoading(false);
            }
        };

        fetchStocks();
    }, []);

    return (
        <div className="most-traded-section">
            <h2 className="most-traded-title">MOST TRADED STOCKS</h2>
            <div className="stock-cards-container">
                {stocks.map(stock => (
                    <StockCard key={stock.ticker} stock={stock} />
                ))}
            </div>
        </div>
    );
};

const InfoIcon = ({ title }) => (
    <span
        title={title}
        style={{ margin: '0 4px', cursor: 'pointer' }}
    >
        ⓘ
    </span>
);

function Trade(props) {
    const [symbol, setSymbol] = useState('');
    const [action, setAction] = useState('buy');
    const [quantity, setQuantity] = useState(0);
    const [orderType, setOrderType] = useState('market');
    const [limitPrice, setLimitPrice] = useState(0);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const { user } = useAuth();    const handleSubmit = async () => {
        setLoading(true);
        try {
            // First get the stock details to get the stock ID
            const stockDetails = await getStockBySymbol(symbol.toUpperCase());
            if (!stockDetails || !stockDetails.id) {
                throw new Error(`Could not find stock with symbol ${symbol}`);
            }
            
            const orderData = {
                userId: user.id,
                stockId: stockDetails.id, // Use the stock ID from the fetched details
                quantity: parseInt(quantity),
                price: orderType === 'limit' ? parseFloat(limitPrice) : null,
                orderType: `${orderType.charAt(0).toUpperCase() + orderType.slice(1)} ${action.charAt(0).toUpperCase() + action.slice(1)}` // "Market Buy", "Limit Sell", etc.
            };

            const result = await createOrder(orderData);
        
            
            // Set success message
            setSuccessMessage(`Order placed successfully! Stock: ${symbol}, Quantity: ${quantity}, Price: ${orderType === 'limit' ? `$${limitPrice}` : 'Market Price'}`);
            setTimeout(() => setSuccessMessage(''), 5000); // Clear message after 5 seconds
            
            // Reset form
            setQuantity(0);
            setLimitPrice(0);
        } catch (error) {
            alert('Failed to place order: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setSymbol('');
        setQuantity(0);
        setLimitPrice(0);
    };

    return (
        <div className="trade-page-container">
            <h1 className="trade-title">Trade</h1>
            <p className="trade-intro-text">
                Welcome to the Trade page! Here you can look up stock symbols, place buy or sell orders using different order types, and manage your trades within the simulation. Monitor the most traded stocks below.
            </p>

            <div className="account-summary-bar">
                <div className="summary-item">
                    <div className="item-title">Account Value</div>
                    <div className="item-value">$100,000.00</div>
                </div>
                <div className="summary-item">
                    <div className="item-title">Buying Power</div>
                    <div className="item-value">$100,000.00</div>
                </div>
                <div className="summary-item">
                    <div className="item-title">Cash</div>
                    <div className="item-value">$100,000.00</div>
                </div>
            </div>

            <MostTradedStocks />

            <div className="trade-content-area">
                <div className="form-section">
                    <label htmlFor="symbol-lookup" className="form-label">Symbol</label>
                    <div className="input-with-icon">
                        <input
                            type="text"
                            id="symbol-lookup"
                            className="form-input"                            placeholder="Look up Symbol Name"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-column">
                        <label htmlFor="action-select" className="form-label">
                            Action 
                        </label>
                        <select 
                            id="action-select" 
                            className="form-select"
                            value={action}
                            onChange={(e) => setAction(e.target.value)}
                        >
                            <option value="buy">Buy</option>
                            <option value="sell">Sell</option>
                        </select>
                    </div>
                    <div className="form-column">
                        <label htmlFor="quantity-input" className="form-label">Quantity</label>
                        <div className="input-with-side-action">
                           <input
                                type="number"
                                id="quantity-input"
                                className="form-input"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                min="0"
                           />
                        </div>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-column">
                        <label htmlFor="order-type-select" className="form-label">
                            Order Type <InfoIcon title="Market Order: Executes immediately at the current market price. Limit Order: Executes only at a specified price or better you choose" />
                        </label>
                        <select 
                            id="order-type-select" 
                            className="form-select"
                            value={orderType}
                            onChange={(e) => setOrderType(e.target.value)}
                        >
                            <option value="market">Market</option>
                            <option value="limit">Limit</option>
                        </select>
                    </div>
                    {orderType === 'limit' && (
                        <div className="form-column">
                            <label htmlFor="limit-price-input" className="form-label">Limit Price</label>
                            <div className="input-with-side-action">
                                <input
                                    type="number"
                                    id="limit-price-input"
                                    className="form-input"
                                    value={limitPrice}
                                    onChange={(e) => setLimitPrice(e.target.value)}
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>
                    )}
                </div>
                <div className="form-actions">
                    <button 
                        type="button" 
                        className="btn btn-clear" 
                        onClick={handleClear}
                        disabled={loading}
                    >
                        CLEAR
                    </button>                    <button 
                        type="button" 
                        className="btn btn-preview" 
                        onClick={handleSubmit}
                        disabled={loading || !symbol || quantity <= 0 || (orderType === 'limit' && limitPrice <= 0)}
                    >
                        {loading ? 'PLACING ORDER...' : 'PLACE ORDER'}
                    </button>
                </div>
                {successMessage && (
                    <div className="success-message">
                        {successMessage}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Trade;