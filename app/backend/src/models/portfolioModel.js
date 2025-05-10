class Portfolio{
    constructor(portfolioData){        this.portfolio_id = portfolioData.portfolio_id;
        this.user_id = portfolioData.user_id;
        this.cash_balance = portfolioData.cash_balance;
        this.creation_date = portfolioData.creation_date;
        this.last_updated = portfolioData.last_updated;
    }

    static getPortfolio(portfolioData){
        return {
            portfolio_id: portfolioData.portfolio_id,
            user_id: portfolioData.user_id,
            cash_balance: portfolioData.cash_balance,
            creation_date: portfolioData.creation_date,
            last_updated: portfolioData.last_updated,
            total_value: portfolioData.total_value // This is calculated on-the-fly in the service
        };
    }
}

export default Portfolio;