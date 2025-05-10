/**
 * @file tradingSessionMiddleware.js
 * @description Middleware to check if the trading session is active
 * When a user from frontend send a place order request, this middleware will check if the trading session is active or not. If not active,
 * then the request will be rejected and the user will be notified that the trading session is not active. If yes, then the request
 * will be passed to the next middleware or controller.
 */
import { isTradingSessionActiveStatus } from '../services/tradingSessionService.js';

const isTradingSessionMiddleware = (req, res, next) => {
    if (!isTradingSessionActiveStatus()) {
        return res.status(200).json({ success: false, message: 'Trading is currently closed.' });
    }
    next(); //ALWAYS have next() in the last line of the middleware function to pass control to the next middleware or the controller
};

export default isTradingSessionMiddleware;
