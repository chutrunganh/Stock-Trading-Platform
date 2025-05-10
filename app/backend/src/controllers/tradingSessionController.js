/**
 * @file tradingSessionController.js
 * @description This file contains the function for frontend to interact with the trading session service, which includes:
 * - Starting a trading session
 * - Stopping a trading session
 * - Getting the status of the trading session
 * 
 * This trading session will be used as a context in the trading system (both frontend and backend). 
 * The order can only be placed when the trading session is active to simulate the real world trading system. For example, the HOSE (Ho Chi Minh Stock Exchange) is only open from 9:00 AM to 3:00 PM on weekdays.
 */
import { activateTradingSession, deactivateTradingSession, isTradingSessionActiveStatus } from '../services/tradingSessionService.js';

export const startTradingSession = (req, res) => {
    try {
        activateTradingSession();
        res.status(200).json({ success: true, message: 'Trading session started.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to start trading session.', error: error.message });
    }
};

export const stopTradingSession = async (req, res) => {
    try {
        await deactivateTradingSession();
        res.status(200).json({ success: true, message: 'Trading session stopped and prices recorded.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to stop trading session.', error: error.message });
    }
};

export const getStatus = (req, res) => {
    const isActive = isTradingSessionActiveStatus();
    res.status(200).json({ isActive });
};
