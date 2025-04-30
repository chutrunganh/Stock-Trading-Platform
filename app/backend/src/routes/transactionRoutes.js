// import express from 'express';
// import { 
//     createTransaction, 
//     getAllTransactions, 
//     getTransactionsByPortfolioId, 
//     getTransactionsByStockId, 
//     deleteTransactionsByPortfolioId, 
//     deleteTransactionByStockId 
// } from '../controllers/transactionController.js';

// const router = express.Router();

// //route to create a new transaction
// //consider about middleware layer to validate the transaction info
// //and handler


// router.post('/', createTransaction);

// //route for users to see their transaction history (by portfolio_id)
// router.get('/portfolio/:portfolio_id', getTransactionsByPortfolioId);

// //see all transactions(admin only)
// router.get('/all', getAllTransactions);

// //see transactions of a specific stock for admin only (by stock_id)
// router.get('/stock/:stock_id', getTransactionsByStockId);

// //route to delete transactions by portfolio_id (for users)
// //consider again about this part later
// //because this will delete all transactions history of user
// //and it delete directly from the database so it is not reversible
// router.delete('/portfolio/:portfolio_id', deleteTransactionsByPortfolioId);

// //route to delete transactions by stock_id (for admins)
// //this only applied to the stock_id that is removed from stock market
// //and it will delete all transactions history of that stock
// router.delete('/stock/:stock_id', deleteTransactionByStockId);

// export default router;

