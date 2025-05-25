/**
 * @file createStockTable.js
 * @description This file contains the function to create the stock table in the database.
 * For simplicity in the scope of this project, this table is predefined with a fix set of stocks and can not be changed.
 */
import pool from './dbConnect.js';
import log from '../utils/loggerUtil.js';

const createStockTable = async () => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS "stocks"(
        stock_id SERIAL PRIMARY KEY,
        symbol VARCHAR(10) NOT NULL UNIQUE,
        company_name VARCHAR(100) NOT NULL,
        industry VARCHAR(100) NOT NULL,
        market_cap DECIMAL(15,2) NOT NULL,
        description TEXT NOT NULL
    )`;

    /**
     * The stock_id is the primary key for the stocks table.
     * The symbol is a unique identifier for each stock, this is shown in the stock market, for example, AAPL for Apple, HPG for Hoa Phat.
     * The company_name is the name of the company like Apple Inc, Hoa Phat Group.
     * The industry is the industry of the company like Technology, Consumer Discretionary, etc.
     * The market_cap is the total market value of the company's outstanding shares, which equals stock price multiplied by the number of shares outstanding.
     * The description is a brief description of the company.
     */

    try{
        // In production, you shouldn't drop tables on each startup
        if (process.env.NODE_ENV === 'development'){
            //drop the table to recreate
            await pool.query('DROP TABLE IF EXISTS "stocks" CASCADE');
        }
        await pool.query(queryText);
        
        if (process.env.NODE_ENV === 'development'){
            await seedStockTestData();
        }
    }
    catch(error){
        log.error('Error occurs when creating stock table:', error);
        throw new Error(error.message);
    }
};

const seedStockTestData = async () => {
    try{
        const queryText = `
        INSERT INTO stocks (symbol, company_name, industry, market_cap, description)
        VALUES
        ('VCB', 'Commercial Bank For Foreign Trade Of Vietnam (Vietcombank)', 'Financials', 21570000000, 'Vietcombank is the largest bank in Vietnam, offering a wide range of financial services.'),
        ('BID', 'Commercial Bank For Investment And Development Of Vietnam (BIDV)', 'Financials', 11820000000, 'BIDV provides banking and financial services across Vietnam.'),
        ('VHM', 'Vinhomes', 'Real Estate', 7520000000, 'Vinhomes is a leading real estate developer in Vietnam, specializing in residential properties.'),
        ('CTG', 'Vietnam Joint Stock Commercial Bank for Industry and Trade (VietinBank)', 'Financials', 7520000000, 'VietinBank offers comprehensive banking services and is one of Vietnam''s largest banks.'),
        ('GAS', 'PetroVietnam Gas Joint Stock Corporation', 'Energy', 7410000000, 'PV Gas is a major player in Vietnam''s oil and gas industry, focusing on gas products.'),
        ('AAPL', 'Apple Inc.', 'Technology', 2500000000000, 'Apple Inc. is an American multinational technology company that specializes in consumer electronics, computer software, and online services.'),
        ('GOOGL', 'Google Inc.', 'Technology', 1800000000000, 'Just Google.'),
        ('MSFT', 'Microsoft Corporation', 'Technology', 2900000000000, 'Microsoft develops, licenses, and supports software, services, devices, and solutions worldwide.'),
        ('AMZN', 'Amazon.com Inc.', 'Consumer Discretionary', 1700000000000, 'Amazon is an American multinational technology company focusing on e-commerce, cloud computing, and AI.'),
        ('TSLA', 'Tesla Inc.', 'Automotive', 700000000000, 'Tesla designs, manufactures, and sells electric vehicles and energy storage solutions.'),
        ('META', 'Meta Platforms Inc.', 'Technology', 1100000000000, 'Meta builds technologies that help people connect, find communities, and grow businesses.'),
        ('NVDA', 'NVIDIA Corporation', 'Semiconductors', 2200000000000, 'NVIDIA is a global leader in GPUs for gaming, AI, and data centers.'),
        ('BRK.A', 'Berkshire Hathaway Inc.', 'Financials', 780000000000, 'Berkshire Hathaway is a multinational conglomerate holding company led by Warren Buffett.'),
        ('JPM', 'JPMorgan Chase & Co.', 'Financials', 450000000000, 'JPMorgan Chase is a leading global financial services firm and one of the largest banking institutions in the U.S.'),
        ('V', 'Visa Inc.', 'Financials', 500000000000, 'Visa is a world leader in digital payments, facilitating transactions between consumers, merchants, financial institutions, and governments.')`;
        await pool.query(queryText);
    }
    catch(error){
        log.error('Error adding test data for stocks table:', error);
    }
}

export default createStockTable;