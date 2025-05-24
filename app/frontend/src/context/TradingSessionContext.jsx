/**
 * @file TradingSessionContext.jsx
 * @description This file contains the context for managing the trading session state throughout the application.
 * Every other componet if want to check the trading session status, import this file and use the context.
 */
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import apiClient from '../api/apiClient';

const TradingSessionContext = createContext();

export function TradingSessionProvider({ children }) {
    const [isTradingActive, setIsTradingActive] = useState(false);
    const [_error, setError] = useState(null);
    // Use ref to prevent duplicate API calls during StrictMode double rendering
    const initialCheckDone = useRef(false);

    const checkTradingStatus = async () => {
        try {
            const response = await apiClient.get('/trading-session/status');
            setIsTradingActive(response.data.isActive);
            setError(null);
        } catch (error) {
            console.error('Failed to fetch trading session status:', error);
            setIsTradingActive(false); // Set to false on error
            setError('Unable to check trading status');
        }
    };

    useEffect(() => {
        if (!initialCheckDone.current) {
            checkTradingStatus();
            initialCheckDone.current = true;
        }
        const interval = setInterval(checkTradingStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const startTrading = async () => {
        try {
            await apiClient.post('/trading-session/start');
            await checkTradingStatus(); // Refresh the status after starting
        } catch (error) {
            console.error('Failed to start trading session:', error);
            setError('Failed to start trading session');
        }
    };

    const stopTrading = async () => {
        try {
            await apiClient.post('/trading-session/stop');
            await checkTradingStatus(); // Refresh the status after stopping
        } catch (error) {
            console.error('Failed to stop trading session:', error);
            setError('Failed to stop trading session');
        }
    };

    return (
        <TradingSessionContext.Provider value={{ 
            isTradingActive, 
            startTrading, 
            stopTrading 
        }}>
            {children}
        </TradingSessionContext.Provider>
    );
}

export function useTradingSession() {
    const context = useContext(TradingSessionContext);
    if (!context) {
        return next(new Error('useTradingSession must be used within a TradingSessionProvider'));
    }
    return context;
}

export default TradingSessionContext;
