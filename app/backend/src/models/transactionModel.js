class Transactions{
    constructor(transactionData){
        this.transaction_id = transactionData.transaction_id;
        this.portfolio_id = transactionData.portfolio_id; //foreign key to Portfolio table
        this.stock_id = transactionData.stock_id; //foreign key to Stock table
        this.transaction_type = transactionData.transaction_type;
        this.quantity = transactionData.quantity;
        this.price = transactionData.price;
        this.transaction_date = transactionData.transaction_date;
    }

    //because the information of transaction is not sensitive
    //so we can return all the attributes 
    static getTransaction(transactionData){
        if (!transactionData) return null; // if transactionData is not exist, return null
        return {
            transaction_id: transactionData.transaction_id,
            portfolio_id: transactionData.portfolio_id,
            stock_id: transactionData.stock_id,
            transaction_type: transactionData.transaction_type,
            quantity: transactionData.quantity,
            price: transactionData.price,
            transaction_date: transactionData.transaction_date
        };
    }
}

export default Transactions