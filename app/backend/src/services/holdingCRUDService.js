// import pool from '../config/dbConnect.js';
// import Holdings from '../models/holdingModel.js';

// //create

// export const createHoldingService = async(holdingData) => {
//     const {portfolio_id, stock_id, quantity, average_cost} = holdingData;
//     try{
//         console.log('Add holding row:', {portfolio_id, stock_id, quantity, average_cost});
//         const result = await pool.query(
//             `INSERT INTO holdings (portfolio_id, stock_id, quantity, average_cost)
//             VALUES ($1, $2, $3, $4) RETURNING *`, [portfolio_id, stock_id, quantity, average_cost]
//         );
//     }
//     catch(error){
//         console.log('Error when creating holding rows:', error.message);
//         throw new Error(error.message);
//     }

// };

// //read 

// //get holdings information of a specific user, by their portfolio id
// //for portfolio presentation in user tab

// //get all holdings for admin only 
// export const getAllHoldingByService = async() =>{
//     try{
//         const result = await pool.query('SELECT * FROM holdings');
//         return result.rows;
//     }
//     catch(error){
//         throw new Error('Error happens when get all holdings:', error.message);
//     } 
//  };


// export const getHoldingByUserIdService = async(portfolio_id) =>{
//    try{
//         const result = await pool.query(
//             'SELECT * FROM holdings WHERE portfolio_id = $1', [portfolio_id]);

//         if (!result.rows[0]){
//             throw new Error('This portfolio does not have any holdings');
//         }
//         return Holdings.getHoldings(result.rows[0]);
//    }
//    catch(error){
//         throw new Error('Error happens when get holdings of this user:', error.message);
//    } 
// };


// //update - do it later
// //only update if the user buy the same stock or sell stock

// //delete - i think we don't need feature