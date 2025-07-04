/**
 * @description This file contains constant values used throughout the application
 */

// Defined number of hash rounds that bcrypt will use
export const SALT_ROUNDS = 10;

// Initial cash balance when a new user portfolio is created
export const INITIAL_CASH_BALANCE = 100000.00;

// Default holdings configuration when a new portfolio is created
export const DEFAULT_HOLDING_QUANTITY = 10; // Default number of shares for each stock
export const DEFAULT_HOLDING_COST = 0; // Default cost (given for free initially)

// Other constants can be added here as needed 