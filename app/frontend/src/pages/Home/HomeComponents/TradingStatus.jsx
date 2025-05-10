import React, { useState, useEffect } from 'react';
import { getTradingSessionStatus } from '../../../api/sessionTrading';
import './TradingStatus.css';

function TradingStatus() {
  const [isActive, setIsActive] = useState(null);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchStatus = async () => {
    try {
      const response = await getTradingSessionStatus();
      setIsActive(response.isActive);
      setError(null);
    } catch (err) {
      console.error('Error fetching trading status:', err);
      setError('Unable to fetch trading status');
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh status every 30 seconds
    const statusInterval = setInterval(fetchStatus, 30000);
    
    // Update clock every second
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(clockInterval);
    };
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  if (isActive === null) {
    return (
      <div className="trading-status">
        <div className="trading-status-header">
          <h3>Trading Session Status</h3>
          <div className="digital-clock">
            {formatTime(currentTime)}
          </div>
        </div>
        <div className="status-indicator loading">
          <span className="status-dot"></span>
          <span className="status-text">Loading trading status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="trading-status">
      <div className="trading-status-header">
        <h3>Trading Session Status</h3>
        <div className="digital-clock">
          {formatTime(currentTime)}
        </div>
      </div>
      <div className={`status-indicator ${isActive ? 'active' : 'inactive'}`}>
        <span className="status-dot"></span>
        <span className="status-text">
          {isActive ? 'Market Open - Welcome to trade! The market is now open for trading.' : 'Market Closed - Trading session is currently closed. Please come back during the next trading session.'}
        </span>
      </div>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default TradingStatus; 