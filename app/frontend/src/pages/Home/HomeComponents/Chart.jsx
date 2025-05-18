
import React, { useEffect, useRef, useState } from 'react';

import './Chart.css';
import ReactApexChart from 'react-apexcharts';
import candleStickIcon from '../../../assets/images/candle-stick.png';
import lineIcon from '../../../assets/images/chart.png';
import { NavLink } from 'react-router-dom';


function ChartExample({ row }) {
  const [chartType, setChartType] = useState('candlestick');

  // Prepare series for each chart type
  const candlestickSeries = [
    {
      name: 'Price',
      type: 'candlestick',
      data: [
        { x: 'May 1', y: [100, 120, 90, 110] },
        { x: 'May 2', y: [110, 130, 105, 120] },
        { x: 'May 3', y: [120, 140, 115, 130] },
        { x: 'May 4', y: [130, 135, 120, 125] },
        { x: 'May 5', y: [125, 145, 110, 140] },
        { x: 'May 6', y: [140, 150, 130, 135] },
        { x: 'May 7', y: [135, 155, 120, 150] },
        { x: 'May 8', y: [150, 170, 140, 160] },
        { x: 'May 9', y: [160, 180, 150, 170] },
        { x: 'May 10', y: [170, 175, 160, 165] },
        { x: 'May 11', y: [165, 185, 155, 180] },
        { x: 'May 12', y: [180, 200, 170, 190] },
        { x: 'May 13', y: [190, 210, 180, 200] },
        { x: 'May 14', y: [200, 220, 195, 210] },
        { x: 'May 15', y: [210, 230, 200, 220] },
      ]
    },
    {
      name: 'Volume',
      type: 'bar',
      data: [
        { x: 'May 1', y: 100 },
        { x: 'May 2', y: 120 },
        { x: 'May 3', y: 150 },
        { x: 'May 4', y: 130 },
        { x: 'May 5', y: 1700 },
        { x: 'May 6', y: 2000 },
        { x: 'May 7', y: 2500 },
        { x: 'May 8', y: 3000 },
        { x: 'May 9', y: 3500 },
        { x: 'May 10', y: 4000 },
        { x: 'May 11', y: 4500 },
        { x: 'May 12', y: 5000 },
        { x: 'May 13', y: 5500 },
        { x: 'May 14', y: 6000 },
        { x: 'May 15', y: 6500 },
      ],
      color: '#a259f7', // purple
    }
  ];

  // For line chart, use a single series with y as a number (not array)
  const lineSeries = [
    {
      name: 'Price',
      type: 'line',
      data: [
        { x: 'May 1', y: 110 },
        { x: 'May 2', y: 120 },
        { x: 'May 3', y: 130 },
        { x: 'May 4', y: 125 },
        { x: 'May 5', y: 140 },
        { x: 'May 6', y: 135 },
        { x: 'May 7', y: 150 },
        { x: 'May 8', y: 160 },
        { x: 'May 9', y: 170 },
        { x: 'May 10', y: 165 },
        { x: 'May 11', y: 180 },
        { x: 'May 12', y: 190 },
        { x: 'May 13', y: 200 },
        { x: 'May 14', y: 210 },
        { x: 'May 15', y: 220 },
      ]
    },
    {
      name: 'Volume',
      type: 'bar',
      data: [
        { x: 'May 1', y: 100 },
        { x: 'May 2', y: 120 },
        { x: 'May 3', y: 150 },
        { x: 'May 4', y: 130 },
        { x: 'May 5', y: 1700 },
        { x: 'May 6', y: 2000 },
        { x: 'May 7', y: 2500 },
        { x: 'May 8', y: 3000 },
        { x: 'May 9', y: 3500 },
        { x: 'May 10', y: 4000 },
        { x: 'May 11', y: 4500 },
        { x: 'May 12', y: 5000 },
        { x: 'May 13', y: 5500 },
        { x: 'May 14', y: 6000 },
        { x: 'May 15', y: 6500 },
      ],
      color: '#a259f7', // purple
    }
  ];

  const series = chartType === 'candlestick' ? candlestickSeries : lineSeries;

  const options = {
    chart: {
      type: chartType,
      height: 350,
      toolbar: {
        show: false,
      },
    },
    xaxis: {
      type: 'date',
      labels: {
        style: {colors: '#FF5722'},
      },
    },
    yaxis: 
      [
        { seriesName: 'Price',
          axisTicks: {show: true},
          axisBorder: {show: true,},
          title: {text: "Price"},
          labels: {style: {colors: '#FF5722'},},
        }, 
        { opposite: true,
          seriesName: 'Volume',
          axisTicks: {show: true},
          axisBorder: {show: true,},
          title: {text: "Volume"},
          labels: {style: {colors: '#FF5722'},},
        }
      ],
    tooltip: {
      x: {
        format: 'dd/MM/yy',
      },
    },
    stroke: {
      curve: 'smooth',
      width: 3,
      colors: '#0090ff',
    },
    
  };

  return (
    <div className="show-chart">
      <div className="header-chart" style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 className='company-name'>Example</h2>
          <div className="chart-stats-row" style={{ display: 'flex', gap: '40px', marginTop: '4px', marginLeft: '10px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 500, fontSize: '20px' }}>May 29</div>
              <div style={{ fontSize: '11px', color: '#888', letterSpacing: '1px' }}>UPCOMING EARNINGS</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 500, fontSize: '20px' }}>2.97</div>
              <div style={{ fontSize: '11px', color: '#888', letterSpacing: '1px' }}>EPS</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 500, fontSize: '20px' }}>3.32T</div>
              <div style={{ fontSize: '11px', color: '#888', letterSpacing: '1px' }}>MARKET CAP</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 500, fontSize: '20px' }}>0.03%</div>
              <div style={{ fontSize: '11px', color: '#888', letterSpacing: '1px' }}>DIV YIELD</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 500, fontSize: '20px' }}>46.04</div>
              <div style={{ fontSize: '11px', color: '#888', letterSpacing: '1px' }}>P/E</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className={`button1${chartType === 'candlestick' ? ' active' : ''}`} onClick={() => setChartType('candlestick')}>
            <img src={candleStickIcon} alt="Candlestick Chart" style={{ width: '32px', height: '32px' }} />
          </button>
          <div className="button-separator"></div>
          <button className={`button2${chartType === 'line' ? ' active' : ''}`} onClick={() => setChartType('line')}>
            <img src={lineIcon} alt="Line Chart" style={{ width: '32px', height: '32px' }} />
          </button>
        </div>
      </div>
      <ReactApexChart
        options={options}
        series={series}
        type={chartType === 'candlestick' ? 'candlestick' : 'line'}
        height={350}
      />
      <div style={{ display: 'flex', justifyContent: 'end'}}>
        <NavLink to="/trade">
          <button className="trade-button" >Trade</button>
        </NavLink>
      </div>
      <></>
    </div>
  );
}

export default ChartExample;
