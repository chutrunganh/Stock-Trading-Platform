import express from 'express';
import {createStockPrice, getAllStockPrice, getStockPriceById} from '../controllers/stockPriceController.js';
import { requireAdminRole } from '../middlewares/roleBasedAccessControlMiddleware.js';
import authMiddleware from '../middlewares/authenticationMiddleware.js';

const router = express.Router();

//there are only 3 routes for stock price, 1 post and 2 get requests
//only the getAllStockPriceById is for user, other two are for admin

// Admin routes - require admin role
router.get("/admin/stockPrice", authMiddleware, requireAdminRole, getAllStockPrice);
router.post("/admin/stockPrice/:id", authMiddleware, requireAdminRole, createStockPrice);

// User routes - require authentication only
// Public route - no authentication required
router.get("/stockPrice/:id", getStockPriceById);

export default router;