import pool from '../config/dbConnect.js';
import Portfolio from '../models/portfolioModel.js';


//create 

export const createPortfolioService = async (portfolioData) => {
    const {user_id, cash_balance,total_value} = portfolioData;
    try{
        console.log("Create portfolio:", {user_id, cash_balance, total_value});
        const result = await pool.query(
            'INSERT INTO portfolios (user_id, cash_balance, total_value) VALUES ($1, $2, $3) RETURNING *',
            [user_id, cash_balance, total_value]
        );
        return Portfolio.getPortfolio(result.rows[0]);
    }
    catch(error){
        console.error('Error when create portfolio:', error.message);
        throw new Error(error.message);
    }
};


//read 

//get all portfolios - for admin
export const getAllPortfoliosService = async () => {
    try{
        const result = await pool.query('SELECT * FROM portfolios');
        return result.rows;
    }
    catch (error){
        throw new Error('Error occurs when getting all portfolios:', error.message);
    }
};

//get portfolio by user_id - specific user (for transaction buy/sell)
export const getPortfolioByUserIdService = async (user_id) => {
    try {
        const result = await pool.query(
            'SELECT * FROM portfolios WHERE user_id = $1',
        [user_id]);
        if (!result.rows[0]){ //no portfolio found
            throw new Error('This user does not have any portfolio');
        }
        return Portfolio.getPortfolio(result.rows[0]);
    }
    catch(error){
        throw error;
    }
};

//update portfolio - cash balance, total value and last updated time
export const updatePortfolioService = async (portfolio_id, portfolioData) => {
    const { cash_balance, total_value } = portfolioData;
    try {
        const result = await pool.query('SELECT * FROM portfolios WHERE portfolio_id = $1', [portfolio_id]);
        if (!result.rows[0]) {
            throw new Error(`Portfolio with ID ${portfolio_id} not found`);
        }

        let queryText = 'UPDATE portfolios SET ';
        const queryParams = [];
        const updates = [];

        if (cash_balance !== undefined) {
            if (cash_balance < 0) {
                throw new Error('Cash balance can not be negative');
            }
            queryParams.push(cash_balance);
            updates.push(`cash_balance = $${queryParams.length}`);
        }

        if (total_value !== undefined) {
            if (total_value < 0) {
                throw new Error('Total value can not be negative');
            }
            queryParams.push(total_value);
            updates.push(`total_value = $${queryParams.length}`);
        }

        const updated_at = new Date();
        queryParams.push(updated_at);
        updates.push(`updated_at = $${queryParams.length}`);

        queryText += updates.join(', ');
        queryParams.push(portfolio_id);
        queryText += ` WHERE portfolio_id = $${queryParams.length} RETURNING *`;
        const updateResult = await pool.query(queryText, queryParams);

        return Portfolio.getPortfolio(updateResult.rows[0]);
    
    } catch (error) {
        console.error(`Error updating portfolio with ID ${portfolio_id}:`, error.message);
        throw error;
    }
};


// //delete portfolio by user_id
// //when create portfolio table, we set the foreign key constraint 
// // to delete portfolio of an user when the user is deleted in user table
// //so maybe we don't need to delete transaction history of this portfolio
// //but we can keep this function for future use
// export const deletePortfolioByPortfolioIdService = async (portfolio_id) => {
//     try {
//         const result = await pool.query(
//             'DELETE FROM portfolios WHERE portfolio_id = $1 RETURNING *',
//             [portfolio_id]
//         );
//         if (!result.rows[0]){ //no portfolio found
//             throw new Error('This user does not have any portfolio');
//         }
//         return Portfolio.getPortfolio(result.rows[0]);
//     }
//     catch(error){
//         throw error;
//     }
// };