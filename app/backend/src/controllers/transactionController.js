import {createTransactionService, getAllTransactionsService, getTransactionByStockIdService, 
    getTransactionByPortfolioIdService} from '../services/transactionCRUDService.js';

const handleResponse = (res, status, message, data = null) => {
    return res.status(status).json({
        status,
        message,
        data,
    });
}
//create
export const createTransaction = async (req, res, next) => {
    const {portfolio_id, stock_id, transaction_type, quantity, price} = req.body;
    console.log(req.body);
    try{
        const newTransaction = await createTransactionService({portfolio_id, stock_id, transaction_type, quantity, price});
        handleResponse(res,201,'Transaction added succesfully', newTransaction);
    }
    catch(error){
        next(error);
    }
}

//read
export const getAllTransactions = async (req, res, next) => {
    try{
        const transactions = await getAllTransactionsService();
        handleResponse(res, 200, 'Transactions list', transactions);
    }
    catch(error){
        next(error);
    }
}

export const getTransactionsByPortfolioId = async (req, res, next) =>{
    const {portfolio_id} = req.params;
    try{
        const transaction = await getTransactionByPortfolioIdService(portfolio_id);
        if (!transaction){
            return handleResponse(res, 404, 'Transaction not found');
        }
        handleResponse(res,200, 'Transactions of portfolio id:', transaction);
    }
    catch(error){
        next(error);
    }
}

export const getTransactionsByStockId = async (req,res, next) => {
    const {stock_id} = req.params;
    try{
        const transaction = await getTransactionByStockIdService(stock_id);
        if (!transaction){
            return handleResponse(res, 404, 'Transaction of stock id not found');
        }
        handleResponse(res,200, 'Transactions of stock id:', transaction);
    }
    catch(error){
        next(error);
    }
}
//look up to transactionCRUDService.js to see why we don't implement update service

