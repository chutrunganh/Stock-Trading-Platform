import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Button} from '@mui/material';
import { getPortfolioDetails, getHoldings, getTransactions } from '../../api/portfolio';
import PaymentModal from './PortfolioComponents/PaymentModal';
import PortfolioPieChart from './PortfolioComponents/PortfolioPieChart';
import './Portfolio.css';

function Portfolio() {
    const [portfolioDetails, setPortfolioDetails] = useState(null);
    const [holdings, setHoldings] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState({
        details: true,
        holdings: false,
        transactions: false
    });
    const [error, setError] = useState(null);
    const [showHoldings, setShowHoldings] = useState(false);
    const [showTransactions, setShowTransactions] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [highlightedSlice, setHighlightedSlice] = useState(null);
    const [chartView, setChartView] = useState('symbol');

    // Fetch portfolio details on component mount
    useEffect(() => {
        fetchPortfolioDetails();
        fetchHoldings();
    }, []);

    const fetchPortfolioDetails = async () => {
        try {
            setLoading(prev => ({ ...prev, details: true }));
            const response = await getPortfolioDetails();
            setPortfolioDetails(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load portfolio details, check your internet connection or re-login');
            console.error('Error fetching portfolio details:', err);
        } finally {
            setLoading(prev => ({ ...prev, details: false }));
        }
    };

    const fetchHoldings = async () => {
        if (!showHoldings) {
            try {
                setLoading(prev => ({ ...prev, holdings: true }));
                const response = await getHoldings();
                setHoldings(response.data);
                setError(null);
            } catch (err) {
                setError('Failed to load holdings');
                console.error('Error fetching holdings:', err);
            } finally {
                setLoading(prev => ({ ...prev, holdings: false }));
            }
        }
        setShowHoldings(prev => !prev);
    };

    const fetchTransactions = async () => {
        if (!showTransactions) {
            try {
                setLoading(prev => ({ ...prev, transactions: true }));
                const response = await getTransactions();
                console.log('Transactions response:', response.data.map(t => ({
                    id: t.transaction_id,
                    date: t.transaction_date,
                    parsed: new Date(t.transaction_date)
                })));
                setTransactions(response.data);
                setError(null);
            } catch (err) {
                setError('Failed to load transactions');
                console.error('Error fetching transactions:', err);
            } finally {
                setLoading(prev => ({ ...prev, transactions: false }));
            }
        }
        setShowTransactions(!showTransactions);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handlePaymentSuccess = (updatedPortfolioData) => {
        setPortfolioDetails(updatedPortfolioData);
    };


    if (loading.details) {
        return (
            <div className="portfolio">
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                    <CircularProgress />
                </Box>
            </div>
        );
    }

    if (error) {
        return (
            <div className="portfolio">
                <Box p={3}>
                    <Typography color="error">{error}</Typography>
                </Box>
            </div>
        );
    }

    return (
        <div className="portfolio">
            <div className="portfolio-container">
                {/* Portfolio Summary Section */}
                <div className = 'grid-container'>
                    <Paper elevation={3} className = 'grid-section'>
                        <div className="section-header">
                            <Typography variant="h5">Portfolio Summary</Typography>
                        </div>
                        <Box mt={2}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1">Available Balance</Typography>
                                    <Typography variant="h4" sx={{ color: 'success.main' }}>
                                        {formatCurrency(portfolioDetails?.cash_balance || 0)}
                                    </Typography>
                                    <Button 
                                        variant="contained" 
                                        color="primary" 
                                        onClick={() => setShowPaymentModal(true)}
                                        sx={{ mt: 1 }}
                                    >
                                        Add Funds
                                    </Button>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle1">Total Holdings Value</Typography>
                                    <Typography variant="h4" sx={{ color: 'success.main' }}>
                                        {formatCurrency(portfolioDetails?.total_value || 0)}
                                    </Typography>
                                </Grid>
                            </Grid>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                * Estimated values are for reference only and do not constitute investment advice
                            </Typography>
                        </Box>
                    </Paper>


                    {/*Chart Section in Portfolio Summary*/}
                    <Paper className='grid-section'>
                        <PortfolioPieChart 
                            holdings={holdings}
                            totalValue={portfolioDetails?.total_value || 0}
                            chartView={chartView}
                            onChartViewChange={setChartView}
                            highlightedSlice={highlightedSlice}
                            onSliceClick={setHighlightedSlice}
                        />
                    </Paper>
                </div>
                {/* Holdings Section */}
                <Paper elevation={3} className="portfolio-section">

                    {/*Holdings Sections in Holdings*/}
                    <div className="section-header" onClick={fetchHoldings}>
                        <Typography variant="h6">
                            Holdings {showHoldings ? '▼' : '▶'}
                        </Typography>
                    </div>
                    {showHoldings && (
                        <Box mt={2}>
                            {loading.holdings ? (
                                <Box display="flex" justifyContent="center" p={3}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Symbol</TableCell>
                                                <TableCell>Company</TableCell>
                                                <TableCell>Quantity</TableCell>
                                                <TableCell>Current Price</TableCell>
                                                <TableCell>Holding Value</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {holdings.map((holding) => (
                                                <TableRow key={holding.holding_id}>
                                                    <TableCell>{holding.symbol}</TableCell>
                                                    <TableCell>{holding.company_name}</TableCell>
                                                    <TableCell>{holding.quantity}</TableCell>
                                                    <TableCell>{formatCurrency(holding.current_price)}</TableCell>
                                                    <TableCell>{formatCurrency(holding.holding_value)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    )}
                </Paper>

                {/* Transactions Section */}
                <Paper elevation={3} className="portfolio-section">
                    <div className="section-header" onClick={fetchTransactions}>
                        <Typography variant="h6">
                            Transaction History {showTransactions ? '▼' : '▶'}
                        </Typography>
                    </div>
                    {showTransactions && (
                        <Box mt={2}>
                            {loading.transactions ? (
                                <Box display="flex" justifyContent="center" p={3}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell className="transaction-date-column">Date</TableCell>
                                                <TableCell className="transaction-symbol-column">Symbol</TableCell>
                                                <TableCell className="transaction-type-column">Type</TableCell>
                                                <TableCell className="transaction-quantity-column" align="right">Quantity</TableCell>
                                                <TableCell className="transaction-price-column" align="right">Price</TableCell>
                                                <TableCell className="transaction-total-column" align="right">Total</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {transactions.map((transaction) => (
                                                <TableRow key={transaction.transaction_id}>
                                                    <TableCell className="transaction-date-column">
                                                        {(() => {
                                                            const rawDate = transaction.transaction_date;
                                                            console.log('Raw date:', rawDate, 'Type:', typeof rawDate);
                                                            
                                                            if (!rawDate) return 'N/A';
                                                            
                                                            // If it's a string, use it directly
                                                            if (typeof rawDate === 'string') {
                                                                try {
                                                                    const date = new Date(rawDate);
                                                                    if (!isNaN(date.getTime())) {
                                                                        return date.toLocaleString('en-US', {
                                                                            year: 'numeric',
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            hour: 'numeric',
                                                                            minute: 'numeric',
                                                                            hour12: true
                                                                        });
                                                                    }
                                                                } catch (e) {
                                                                    console.error('Error parsing date string:', rawDate, e);
                                                                }
                                                            }
                                                            
                                                            console.error('Invalid date value:', rawDate);
                                                            return 'Invalid date';
                                                        })()}
                                                    </TableCell>
                                                    <TableCell className="transaction-symbol-column">{transaction.symbol}</TableCell>
                                                    <TableCell className="transaction-type-column">{transaction.transaction_type}</TableCell>
                                                    <TableCell className="transaction-quantity-column" align="right">{transaction.quantity}</TableCell>
                                                    <TableCell className="transaction-price-column" align="right">{formatCurrency(transaction.price)}</TableCell>
                                                    <TableCell className="transaction-total-column" align="right">
                                                        {formatCurrency(transaction.quantity * transaction.price)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    )}
                </Paper>
            </div>

            {/* Payment Modal */}
            <PaymentModal 
                isOpen={showPaymentModal} 
                onClose={() => setShowPaymentModal(false)}
                onPaymentSuccess={handlePaymentSuccess}
            />
        </div>
    );
}

export default Portfolio;