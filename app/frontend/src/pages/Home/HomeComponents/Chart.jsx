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
        console.log('Price history:', priceHistory); // Debug log

        setStockDetails(details);
        
        // Transform price history data for the chart
        const transformedData = priceHistory.map(price => ({
          x: new Date(price.date).toLocaleDateString(),
          y: [price.open_price, price.high_price, price.low_price, price.close_price]
        }));

        const volumeData = priceHistory.map(price => ({
          x: new Date(price.date).toLocaleDateString(),
          y: price.volume
        }));

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
              data: transformedData.map(d => ({ x: d.x, y: d.y[3] })) // Use closing price for line chart
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
      type: 'category',
      labels: {
        style: {colors: '#FF5722'},
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
      {stockData && (
        <ReactApexChart
          options={options}
          series={stockData[chartType]}
          type={chartType === 'candlestick' ? 'candlestick' : 'line'}
          height={350}
        />
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
