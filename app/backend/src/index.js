// ====== External Dependencies ======
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import passport from 'passport';

// ====== Internal Dependencies ======

// --- Config Files ---
dotenv.config({ path: '../../.env' }); // Load environment variables
import configurePassport from './config/passportConfig.js';

// --- Logging ---
import log from './utils/loggerUtil.js';

// --- Database Connection and Table Creation ---
import pool from './config/dbConnect.js'; // PostgreSQL connection pool
import createUserTable from './config/createUserTable.js';
import createPortfolioTable from './config/createPortfolioTable.js';
import createTransactionTable from './config/createTransactionTable.js';
import createStockTable from './config/createStockTable.js';
import createStockPriceTable from './config/createStockPriceTable.js';
import createHoldingTable from './config/createHoldingTable.js';

// --- Routes ---
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import stockRoutes from './routes/stockRoutes.js';

// --- Middlewares ---
import errorHandling from './middlewares/errorHandlerMiddleware.js';

// --- Controllers ---
import { googleAuth, googleAuthCallback } from './controllers/userControllers.js';

// ===== Initialize Express App ======
const app = express();
const port = process.env.BE_PORT || 3000;

// --- Middleware Configuration ---
app.use(express.json()); // Parse JSON request bodies

// --- CORS Configuration --
// REMEBER TO CHANGE THE CROS ORIGIN BACK TO YOUR FRONTEND URL WHEN DEPLOYING, 
// Idealy, defined the origin in the .env file and use it here.
app.use(cors({
  origin: 'http://localhost:5173', // Allow all origins while testing
  credentials: true // Important for cookies to work with CORS
}));

app.use(cookieParser()); // Add cookie-parser middleware

// --- Google OAuth Configuration ---
const passportInstance = configurePassport();
app.use(passport.initialize());

// --- Google OAuth Routes ---
// Define Google OAuth routes at the root level to match the callback URL in Google Cloud Console
// Two routes will not have prefix /api as other routes since it is not our own API, but Google API
// when user click on "Login with Google" button in frontend, they will be forward to  uor backend endpoint /auth/google
app.get('/auth/google', googleAuth);
app.get('/auth/google/callback', googleAuthCallback);

// --- API Routes ---
app.use('/api', userRoutes);
app.use('/api', orderRoutes);
app.use('/api/stocks', stockRoutes);

// --- Error Handling Middleware ---
// This should be the last middleware in the stack
// It will catch any errors that occur in the routes or other middlewares
app.use(errorHandling);

// --- Initialize All Database Tables ---
const initializeDatabase = async () => {  try {
    // Create tables
    await createUserTable();
    await createPortfolioTable();
    //await createTransactionTable();
    await createStockTable();
    await createStockPriceTable();
    await createHoldingTable();
    
    log.info('All tables initialized successfully!');
  } catch (error) {
    log.error('Tables in database initialization failed', { error });
    process.exit(1); // Exit with error
  }
};

// Start server after database initialization
const startServer = async () => {
    await initializeDatabase();
    
    app.listen(port, () => {
        log.info(`Server is running on port ${port}`);
        log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
};

startServer();