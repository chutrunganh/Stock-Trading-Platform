/**
 * @description This file contains controller to work with transaction CRUD operations.
 */

import {createTransactionService} from '../services/transactionCRUDService.js';

const handleResponse = (res, status, message, data = null) => {
    return res.status(status).json({
        status,
        message,
        data,
    });
}

// Create a new transaction
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
