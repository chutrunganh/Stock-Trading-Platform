class Stocks{
    constructor(StocksData){
        this.stock_id = StocksData.stock_id;
        this.symbol = StocksData.symbol;
        this.company_name = StocksData.company_name;
        this.industry = StocksData.industry;
        this.market_cap = StocksData.market_cap;
        this.description = StocksData.description;
    }

    //information about Stocks is not sensitive -> can return all attributes
    static getStocks(StocksData){
        if (!StocksData) return null; // if StocksData is not exist, return null
        return {
            stock_id: StocksData.stock_id,
            symbol: StocksData.symbol,
            company_name: StocksData.company_name,
            industry: StocksData.industry,
            market_cap: StocksData.market_cap,
            description: StocksData.description
        };
    }
}

export default Stocks;