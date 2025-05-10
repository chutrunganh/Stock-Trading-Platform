import React, { useState, useEffect } from 'react';
import './Admin.css';
import { startTradingSession, stopTradingSession, getTradingSessionStatus } from '../../api/sessionTrading';

function AdminPage() {
  const [isLoadingStart, setIsLoadingStart] = useState(false);
  const [isLoadingStop, setIsLoadingStop] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const fetchSessionStatus = async () => {
    try {
      const response = await getTradingSessionStatus();
      setIsSessionActive(response.isActive);
    } catch (error) {
      console.error('Error fetching session status:', error);
    }
  };

  useEffect(() => {
    fetchSessionStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(fetchSessionStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStartTrading = async () => {
    setIsLoadingStart(true);
    try {
      await startTradingSession();
      setIsSessionActive(true);
    } catch (error) {
      console.error('Error starting trading session:', error);
    } finally {
      setIsLoadingStart(false);
    }
  };

  const handleStopTrading = async () => {
    setIsLoadingStop(true);
    try {
      await stopTradingSession();
      setIsSessionActive(false);
    } catch (error) {
      console.error('Error stopping trading session:', error);
    } finally {
      setIsLoadingStop(false);
    }
  };

  return (
    <div className="admin-page">
      <h2>Admin Controls</h2>
      <p>Control the simulated trading session.</p>

      <div className="admin-actions">
        <div className="action-group">
          <button
            onClick={handleStartTrading}
            disabled={isLoadingStart || isLoadingStop || isSessionActive}
            className={`admin-button start-button ${isSessionActive ? 'disabled' : ''}`}
          >
            {isLoadingStart ? 'Starting...' : 'Start Trading Session'}
          </button>
        </div>

        <div className="action-group">
          <button
            onClick={handleStopTrading}
            disabled={isLoadingStart || isLoadingStop || !isSessionActive}
            className={`admin-button stop-button ${!isSessionActive ? 'disabled' : ''}`}
          >
            {isLoadingStop ? 'Stopping...' : 'Stop Trading Session'}
          </button>
        </div>
      </div>

      <div className="session-status">
        <p className={`status-indicator ${isSessionActive ? 'active' : 'inactive'}`}>
          Current Status: {isSessionActive ? 'Trading Session Active' : 'Trading Session Inactive'}
        </p>
      </div>
    </div>
  );
}

export default AdminPage;
