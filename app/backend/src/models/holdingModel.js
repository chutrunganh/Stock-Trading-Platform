/**
 * @file holdingModel.js
 * @description Define the schema gor the hoding table in the database.
 */
class Holdings{
    constructor(holdingData){
        this.holding_data = holdingData.holding_data;
        this.portfolio_id = holdingData.portfolio_id;
        this.stock_id = holdingData.stock_id;
        this.quantity = holdingData.quantity;        this.average_price = holdingData.average_price; //average price of the holding
    }

    static getHoldings(holdingData){
        if (!holdingData) return null; //if holdingData is not exist, return null
        return {
            portfolio_id: holdingData.portfolio_id,
            stock_id: holdingData.stock_id,
            quantity: holdingData.quantity,
            average_price: holdingData.average_price,
        };
    }
}

export default Holdings;