import {createStockPriceService,
    getAllStockPricesService,
    getStockPricesByStockIdService,
} from '../services/stockPriceService.js';

const handleResponse = (res, status, message, data = null) => {
    return res.status(status).json({
        status,
        message,
        data,
    });
}
//create
export const createStockPrice = async (req, res, next) => {
    const {stock_id, date, open_price, high_price, low_price, close_price, volume} = req.body;
    try{
        const newStockPrice = await createStockPriceService({stock_id, date, open_price, high_price, low_price, close_price, volume}); 
        handleResponse(res, 201, 'Stock price added succesfully', newStockPrice);
    }
    catch(error){
        next(error);
    }
}


//read

export const getAllStockPrice = async (req, res, next) => {
    console.log('All the stock prices: ');
    try{
        const results = await getAllStockPricesService();
        handleResponse(res, 200, 'All stock prices:', results);
    }
    catch(error){
        next(error);
    }
}

export const getStockPriceById = async (req, res, next) => {
    try{
        const id = parseInt(req.params.id, 10); // Convert to integer
        //because the id fields in the req.params can be string
        //so it must be converted into integer before passed to the stockPriceService
        console.log('Stock ID received in controller:', id);
        const results = await getStockPricesByStockIdService(id);
        if (!results){
            return handleResponse(res,404, 'This stock id is not true or does not exist');
        }
        handleResponse(res, 200, 'Stock prices of this stock id:', results);
    }
    catch(error){
        next(error);
    }
}