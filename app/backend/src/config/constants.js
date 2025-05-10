/**
 * @file constants.js
 * @description This file contains constant values used throughout the application
 */

// Defined number of hash rounds for bcrypt
export const SALT_ROUNDS = 10;

// Initial cash balance for new user portfolios
export const INITIAL_CASH_BALANCE = 100000.00;

// Default holdings configuration for new portfolios
export const DEFAULT_HOLDING_QUANTITY = 10; // Default number of shares for each stock
export const DEFAULT_HOLDING_COST = 0; // Default cost (given for free initially)

// Other constants can be added here as needed 