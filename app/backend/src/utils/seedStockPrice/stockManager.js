// src/utils/stockManager.js
import { exec } from 'child_process';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';
import { getStockBySymbolService } from '../../services/stockCRUDService.js';
import { dirname } from 'path';

// Setup path resolution for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompts user for input with a given question
 * @param {string} question - The question to ask the user
 * @returns {Promise<string>} - The user's response
 */
function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Executes the Python stock fetcher script with specified arguments
 * @param {string} command - The command to execute
 * @returns {Promise<string>} - The output of the command
 */
function executePythonScript(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Command stderr: ${stderr}`);
      }
      resolve(stdout);
    });
  });
}

/**
 * Main function to manage stock data
 */
async function manageStock() {
  try {
    // Get user input for stock details
    const symbol = await promptUser('Enter stock symbol (e.g., AAPL): ');
    const startDate = await promptUser('Enter start date (YYYY-MM-DD) or press Enter for last 30 days: ');
    const endDate = await promptUser('Enter end date (YYYY-MM-DD) or press Enter for today: ');
    
    // Check if stock already exists in our database
    let stockExists = false;
    try {
      const existingStock = await getStockBySymbolService(symbol);
      stockExists = true;
      console.log('Stock already exists in database with the following details:');
      console.log(`Symbol: ${existingStock.symbol}`);
      console.log(`Company Name: ${existingStock.company_name}`);
      console.log(`Industry: ${existingStock.industry}`);
      console.log(`Market Cap: ${existingStock.market_cap}`);
      
      const updateChoice = await promptUser('Do you want to update this stock information? (yes/no): ');
      if (updateChoice.toLowerCase() !== 'yes') {
        console.log('Skipping stock info update.');
        // Still fetch price data without updating stock info
        await fetchPriceData(symbol, startDate, endDate, false);
        rl.close();
        return;
      }
      
      // If yes, we'll update the stock info
      await fetchPriceData(symbol, startDate, endDate, true);
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log(`Stock ${symbol} doesn't exist in our database. Checking if it exists in real life...`);
        await fetchPriceData(symbol, startDate, endDate, false);
      } else {
        throw error;
      }
    }
    
    rl.close();
  } catch (error) {
    console.error('An error occurred:', error.message);
    rl.close();
    process.exit(1);
  }
}

/**
 * Function to fetch price data using the Python script
 * @param {string} symbol - Stock symbol
 * @param {string} startDate - Start date for price data
 * @param {string} endDate - End date for price data
 * @param {boolean} updateInfo - Whether to update existing stock info
 */
async function fetchPriceData(symbol, startDate, endDate, updateInfo) {
  try {
    // Since we're in src/utils/seedStockPrice and stock_fetcher.py is in the same directory
    const pythonScriptPath = path.join(__dirname, 'stock_fetcher.py');
    // Quote the Python script path to handle spaces
    let command = `python "${pythonScriptPath}" ${symbol}`;
    
    if (startDate) {
      command += ` --start ${startDate}`;
    }
    
    if (endDate) {
      command += ` --end ${endDate}`;
    }
    
    if (updateInfo) {
      command += ' --update-info';
    }
    
    console.log(`Executing: ${command}`);
    const result = await executePythonScript(command);
    
    console.log('Python script output:');
    console.log(result);
    
    // Check if the script was successful
    if (result.includes('Operation completed successfully')) {
      console.log('Stock data has been successfully processed and saved to the database.');
    } else if (result.includes('No company information found') || result.includes('No price data found')) {
      console.log(`The stock ${symbol} doesn't appear to exist in real life or couldn't be fetched.`);
    }
  } catch (error) {
    console.error('Error fetching stock data:', error.message);
    throw error;
  }
}

// Execute the main function
manageStock();