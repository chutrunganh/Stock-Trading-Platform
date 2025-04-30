class StockPrices{
    constructor(stockpriceData){
        this.price_id = stockpriceData.price_id;
        this.stock_id = stockpriceData.stock_id; //foreign key to Stock table
        this.date = stockpriceData.date;
        this.open_price = stockpriceData.open_price;
        this.high_price = stockpriceData.high_price;
        this.low_price = stockpriceData.low_price;
        this.close_price = stockpriceData.close_price;
        this.volume = stockpriceData.volume;
    }
    static getStockPrices(stockpriceData){
        if (!stockpriceData) return null; // if stockpriceData is not exist, return null
        return {
            price_id: stockpriceData.price_id,
            stock_id: stockpriceData.stock_id,
            date: stockpriceData.date,
            open_price: stockpriceData.open_price,
            high_price: stockpriceData.high_price,
            low_price: stockpriceData.low_price,
            close_price: stockpriceData.close_price,
            volume: stockpriceData.volume
        };
    }
}

export default StockPrices;