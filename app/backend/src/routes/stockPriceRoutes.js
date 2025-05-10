import express from 'express';
import {createStockPrice,getAllStockPrice,getStockPriceById} from '../controllers/stockPriceController.js';
import authorizeRole from '../middlewares/roleBasedAccessControlMiddleware.js';
import authMiddleware from '../middlewares/authenticationMiddleware.js';
const router = express.Router();

//there are only 3 routes for stock price, 1 post and 2 get requests
//only the getAllStockPriceById is for user, other two are for admin

//admin only
router.get("/admin/stockPrice", authMiddleware, authorizeRole('admin'), getAllStockPrice); //get all stock prices for admin
router.post("/admin/stockPrice/:id", authMiddleware, authorizeRole('admin'), createStockPrice);

//all user
router.get("/stockPrice/:id", authMiddleware, getStockPriceById);


export default router;