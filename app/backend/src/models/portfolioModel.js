class Portfolio{
    constructor(portfolioData){
        this.portfolio_id = portfolioData.portfolio_id;
        this.user_id = portfolioData.user_id;
        this.cash_balance = portfolioData.cash_balance;
        this.total_value = portfolioData.total_value;
        this.created_at = portfolioData.created_at;
        this.updated_at = portfolioData.updated_at; //last update when
    }

    static getPortfolio(portfolioData){
        if (!portfolioData) return null; //if portfolioData is not exist, return null
        return {
            portfolio_id: portfolioData.portfolio_id,
            user_id: portfolioData.user_id,
            cash_balance: portfolioData.cash_balance,
            total_value: portfolioData.total_value,
            created_at: portfolioData.created_at,
            updated_at: portfolioData.updated_at 
        };
    }
}

export default Portfolio;