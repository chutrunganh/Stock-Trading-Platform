class Holdings{
    constructor(holdingData){
        this.holding_data = holdingData.holding_data;
        this.portfolio_id = holdingData.portfolio_id;
        this.stock_id = holdingData.stock_id;
        this.quantity = holdingData.quantity;
        this.average_cost = holdingData.average_cost; //average selling price
    }

    static getHoldings(holdingData){
        if (!holdingData) return null; //if holdingData is not exist, return null
        return {
            portfolio_id: holdingData.portfolio_id,
            stock_id: holdingData.stock_id,
            quantity: holdingData.quantity,
            average_cost: holdingData.average_cost,
        };
    }
}

export default Holdings;