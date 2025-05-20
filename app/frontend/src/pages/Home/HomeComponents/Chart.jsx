import React, { useEffect, useState } from 'react';
import './Chart.css';
import ReactApexChart from 'react-apexcharts';
import candleStickIcon from '../../../assets/images/candle-stick.png';
import lineIcon from '../../../assets/images/chart.png';
import { NavLink } from 'react-router-dom';
import { getStockPriceHistory, getStockDetails } from '../../../api/stockPrice';
import { CircularProgress, ToggleButtonGroup, ToggleButton } from '@mui/material';

function Chart({ selectedStock }) {
  const [chartType, setChartType] = useState('candlestick');
  const [stockData, setStockData] = useState(null);
  const [stockDetails, setStockDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedStock) return;
      
      setLoading(true);
      setError(null);
      try {
        console.log('Selected stock:', selectedStock); // Debug log
        
        // Fetch stock details and price history in parallel
        const [details, priceHistory] = await Promise.all([
          getStockDetails(selectedStock.Symbol),
          getStockPriceHistory(selectedStock.id || selectedStock.stock_id)
        ]);

        console.log('Stock details:', details); // Debug log
        console.log('Price history raw data:', priceHistory); // Debug log
        
        if (!priceHistory || priceHistory.length === 0) {
          console.error('No price history data available for this stock');
          setError('No price history data available for this stock');
          setLoading(false);
          return;
        }

        // Log the structure of the first date object to debug
        if (priceHistory[0] && priceHistory[0].date) {
          console.log('Date structure:', priceHistory[0].date);
          console.log('Date type:', typeof priceHistory[0].date);
          
          // If date is an object, log its properties
          if (typeof priceHistory[0].date === 'object' && priceHistory[0].date !== null) {
            console.log('Date object properties:', Object.keys(priceHistory[0].date));
            for (const key in priceHistory[0].date) {
              console.log(`Date object ${key}:`, priceHistory[0].date[key]);
            }
          }
        }

        setStockDetails(details);
        
        // Transform price history data for the chart
        const transformedData = priceHistory
          .filter(price => price !== null) // Filter out null entries
          .map((price, index) => {
            try {
              let timestamp;
              
              // Check the type of date and handle accordingly
              if (price.date) {
                if (typeof price.date === 'string') {
                  // If date is a string, parse it normally
                  timestamp = new Date(price.date).getTime();
                } else if (typeof price.date === 'object') {
                  // If date is an object, try to extract date information
                  // If it has a toString method or value property, try those
                  if (price.date.toString && typeof price.date.toString === 'function') {
                    console.log('Using date.toString():', price.date.toString());
                    timestamp = new Date(price.date.toString()).getTime();
                  } else if (price.date.value) {
                    console.log('Using date.value:', price.date.value);
                    timestamp = new Date(price.date.value).getTime();
                  } else {
                    // Try all properties that might contain date strings
                    const possibleDateProps = ['date', 'value', 'time', 'timestamp'];
                    for (const prop of possibleDateProps) {
                      if (price.date[prop] && typeof price.date[prop] === 'string') {
                        console.log(`Using date.${prop}:`, price.date[prop]);
                        timestamp = new Date(price.date[prop]).getTime();
                        if (!isNaN(timestamp)) break;
                      }
                    }
                  }
                }
              }
              
              // If we couldn't extract a valid date, use the index as a fallback
              if (isNaN(timestamp) || !timestamp) {
                console.log('Using fallback date for index:', index);
                // Create sequential dates starting from today and going backwards
                const today = new Date();
                timestamp = new Date(today.setDate(today.getDate() - index)).getTime();
              }
              
              // Parse price values
              const openPrice = parseFloat(price.open_price);
              const highPrice = parseFloat(price.high_price);
              const lowPrice = parseFloat(price.low_price);
              const closePrice = parseFloat(price.close_price);
              
              // Validate price values
              if (isNaN(openPrice) || isNaN(highPrice) || isNaN(lowPrice) || isNaN(closePrice)) {
                console.error('Invalid price data:', price);
                return null;
              }

              return {
                x: timestamp,
                y: [openPrice, highPrice, lowPrice, closePrice]
              };
            } catch (err) {
              console.error('Error processing price data:', err, price);
              return null;
            }
          })
          .filter(item => item !== null) // Remove any invalid entries
          .sort((a, b) => a.x - b.x); // Sort by date ascending

        const volumeData = priceHistory
          .filter(price => price !== null)
          .map((price, index) => {
            try {
              let timestamp;
              
              // Similar date handling as above
              if (price.date) {
                if (typeof price.date === 'string') {
                  timestamp = new Date(price.date).getTime();
                } else if (typeof price.date === 'object') {
                  if (price.date.toString && typeof price.date.toString === 'function') {
                    timestamp = new Date(price.date.toString()).getTime();
                  } else if (price.date.value) {
                    timestamp = new Date(price.date.value).getTime();
                  } else {
                    const possibleDateProps = ['date', 'value', 'time', 'timestamp'];
                    for (const prop of possibleDateProps) {
                      if (price.date[prop] && typeof price.date[prop] === 'string') {
                        timestamp = new Date(price.date[prop]).getTime();
                        if (!isNaN(timestamp)) break;
                      }
                    }
                  }
                }
              }
              
              // Fallback to using index for date
              if (isNaN(timestamp) || !timestamp) {
                const today = new Date();
                timestamp = new Date(today.setDate(today.getDate() - index)).getTime();
              }
              
              const volume = parseFloat(price.volume) || 0;

              return {
                x: timestamp,
                y: volume
              };
            } catch (err) {
              console.error('Error processing volume data:', err, price);
              return null;
            }
          })
          .filter(item => item !== null)
          .sort((a, b) => a.x - b.x); // Sort by date ascending

        console.log('Transformed price data:', transformedData);
        console.log('Transformed volume data:', volumeData);
        
        if (transformedData.length === 0) {
          console.error('No valid data points after transformation');
          setError('No valid data points for chart');
          setLoading(false);
          return;
        }

        setStockData({
          candlestick: [
            {
              name: 'Price',
              type: 'candlestick',
              data: transformedData
            },
            {
              name: 'Volume',
              type: 'bar',
              data: volumeData,
              color: '#a259f7'
            }
          ],
          line: [
            {
              name: 'Price',
              type: 'line',
              data: transformedData.map(d => ({ x: d.x, y: d.y[3] })), // Use closing price for line chart
            },
            {
              name: 'Volume',
              type: 'bar',
              data: volumeData,
              color: '#a259f7'
            }
          ]
        });
      } catch (err) {
        setError(err.message);
        console.error('Error fetching stock data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedStock]);

  const options = {
    chart: {
      type: chartType,
      height: 350,
      toolbar: {
        show: false,
      },
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: {colors: '#FF5722'},
        datetimeFormatter: {
          year: 'yyyy',
          month: "MMM 'yy",
          day: 'dd MMM',
          hour: 'HH:mm'
        }
      },
    },
    yaxis: [
      {
        seriesName: 'Price',
        axisTicks: {show: true},
        axisBorder: {show: true},
        title: {text: "Price"},
        labels: {style: {colors: '#FF5722'}},
        tooltip: {
          enabled: true
        }
      },
      {
        opposite: true,
        seriesName: 'Volume',
        axisTicks: {show: true},
        axisBorder: {show: true},
        title: {text: "Volume"},
        labels: {style: {colors: '#FF5722'}},
      }
    ],
    tooltip: {
      enabled: true,
      theme: 'dark',
      style: {
        fontSize: '12px',
        fontFamily: undefined
      },
      x: {
        show: true,
        format: 'dd MMM yyyy',
      },
      y: {
        formatter: undefined,
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3,
      colors: '#0090ff',
    }
  };

  if (!selectedStock) {
    return (
      <div className="show-chart" style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Select a stock from the table to view its chart</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="show-chart" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className="show-chart" style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
        <h2>Error loading chart data</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="show-chart">
      <div className="header-chart" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 className='company-name'>{selectedStock.Symbol}</h2>
          {stockDetails && (
            <div className="stock-details">
              <p className="company-full-name">{stockDetails.company_name}</p>
              <p className="stock-info">Industry: {stockDetails.industry}</p>
              <p className="stock-description">{stockDetails.description}</p>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={(e, newType) => newType && setChartType(newType)}
            size="small"
            className="chart-toggle-group"
          >
            <ToggleButton value="candlestick" className="chart-toggle-btn">
              <img src={candleStickIcon} alt="Candlestick Chart" style={{ width: '24px', height: '24px', marginRight: 6 }} />
              Candlestick
            </ToggleButton>
            <ToggleButton value="line" className="chart-toggle-btn">
              <img src={lineIcon} alt="Line Chart" style={{ width: '24px', height: '24px', marginRight: 6 }} />
              Line
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </div>
      {stockData && stockData[chartType][0].data.length > 0 ? (
        <ReactApexChart
          options={options}
          series={stockData[chartType]}
          type={chartType === 'candlestick' ? 'candlestick' : 'line'}
          height={350}
        />
      ) : (
        <div style={{ height: '350px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px dashed #ccc', borderRadius: '8px' }}>
          <p>No chart data available for this stock</p>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'end'}}>
        <NavLink to={`/trade?symbol=${selectedStock.Symbol}`}>
          <button className="trade-button">Trade</button>
        </NavLink>
      </div>
    </div>
  );
}

export default Chart;
