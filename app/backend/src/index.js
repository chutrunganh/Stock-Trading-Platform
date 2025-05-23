// ====== External Dependencies ======
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import helmet from 'helmet';
import crypto from 'crypto';

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
import { INITIAL_CASH_BALANCE, SALT_ROUNDS } from './config/constants.js';
import createPaymentTransactionsTable from './config/createPaymentTransactionsTable.js';
import createRememberedDevicesTable from './config/createRememberedDevicesTable.js';


// --- Routes ---
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import tradingSessionRoutes from './routes/tradingSessionRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import stockPriceRoutes from './routes/stockPriceRoutes.js';

// --- Middlewares ---
import errorHandling from './middlewares/errorHandlerMiddleware.js';
import { sanitizeResponse } from './middlewares/responseSanitizationMiddleware.js';

import { initializeAdminUser, initializeNormalUser } from './utils/initUserUtil.js';

// ===== Initialize Express App ======
const app = express();
const port = process.env.BE_PORT || 3000;

// --- Security Middleware Configuration ---
// For more detail, you can refer to: https://www.npmjs.com/package/helmet
// Configure Helmet with CSP and other security headers
app.use(helmet());

// Generate a nonce for each request
app.use((_req, res, next) => {
  // Generate a random nonce
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

// Configure Content Security Policy (CSP)
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      // Restrict default loading of resources to only our own domain
      defaultSrc: ["'self'"],

      // Only allow scripts from:
      // - our own domain ('self')
      // - Cloudflare's challenge scripts (for Turnstile)
      scriptSrc: [
        "'self'",
        "https://challenges.cloudflare.com"
      ],

      // Only allow styles from:
      // - our own domain ('self')
      // - Google Fonts CSS
      styleSrc: [
        "'self'",
        "https://fonts.googleapis.com"
      ],

      // Only allow images from our own domain
      imgSrc: ["'self'"],

      // Only allow API/AJAX calls to:
      // - our own domain ('self')
      // - Cloudflare's API (for Turnstile verification)
      connectSrc: [
        "'self'",
        "https://api.cloudflare.com"
      ],

      // Only allow fonts from:
      // - our own domain ('self')
      // - Google Fonts
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],

      // Completely block all object/embed/applet tags
      objectSrc: ["'none'"],

      // Only allow media (audio/video) from our own domain
      mediaSrc: ["'self'"],

      // Only allow frames from:
      // - our own domain ('self')
      // - Cloudflare's challenge frames
      frameSrc: [
        "'self'",
        "https://challenges.cloudflare.com"
      ],

      // Restrict base URI to our own domain only
      baseUri: ["'self'"],

      // Only allow forms to submit to our own domain
      formAction: ["'self'"],

      // Prevent our site from being embedded in any other website
      frameAncestors: ["'none'"],

      // Block mixed content (HTTP resources on HTTPS site)
      upgradeInsecureRequests: [],

      // Restrict manifest files to our own domain
      manifestSrc: ["'self'"],

      // Only allow workers from our own domain
      workerSrc: ["'self'"],

      // Prevent loading any plugins
      pluginTypes: ["'none'"]
    }
  })
);

// Configure X-Frame-Options to prevent clickjacking
app.use(helmet.frameguard({ action: 'deny' }));

// Remove X-Powered-By header to prevent leaking information about s
app.disable('x-powered-by');

// --- Middleware Configuration ---
app.use(express.json()); // Parse JSON request bodies

// Apply response sanitization middleware globally
app.use(sanitizeResponse);

// --- CORS Configuration --
// Configure CORS with support for SSE
app.use((req, res, next) => {  // Special handling for SSE endpoint
  if (req.path === '/api/orders/orderBook/stream') {
    res.setHeader('Access-Control-Allow-Origin', process.env.FE_URL);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Content-Type', 'text/event-stream');
  }
  next();
});

// Regular CORS configuration for other routes
app.use(cors({
  origin: process.env.FE_URL, // Allow frontend origin
  credentials: true, // Important for cookies to work with CORS
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type']
}));

// Add headers specifically for SSE connections
app.use((req, res, next) => {
  // Check if the request is for SSE
  if (req.path === '/api/orders/orderBook/stream') {
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for Nginx
    res.setHeader('Connection', 'keep-alive');
  }
  next();
});

app.use(cookieParser()); // Add cookie-parser middleware

// --- Google OAuth Configuration ---
configurePassport();
app.use(passport.initialize());

// --- API Routes ---
// Mount routes
app.use('/api', userRoutes); // Changed from '/api/auth' to '/api' to match frontend paths
app.use('/api/orders', orderRoutes);
app.use('/api/trading-session', tradingSessionRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', stockPriceRoutes); // Add stock price routes


// --- Error Handling Middleware ---
// This should be the last middleware in the stack
// It will catch any errors that occur in the routes or other middlewares
// Routes

app.use(errorHandling);

// --- Initialize All Database Tables ---
const initializeDatabase = async () => {  try {
    // Create tables in proper dependency order
    await createUserTable();         // First create users
    await createPortfolioTable();    // Portfolios depend on users
    await createStockTable();        // Create stocks before stock-related tables
    await createStockPriceTable();   // StockPrices depend on stocks
    await createTransactionTable();  // Transactions depend on stocks and portfolios
    await createHoldingTable();      // Holdings depend on stocks and portfolios
    await createPaymentTransactionsTable();
    await createRememberedDevicesTable();
    
    log.info('All tables initialized successfully!');
  } catch (error) {
    log.error('Tables in database initialization failed', { error });
    process.exit(1); // Exit with error
  }
};

// --- User Initialization Utilities ---

// Start server after database initialization
const startServer = async () => {
    await initializeDatabase();
    // Init some testing accounts
    // Note that you should choose the password following the password policy manuly, since this
    // functions run SQL commands directly, not by using our registration functions so it not affected by the password policy
    await initializeAdminUser({
      pool,
      log,
      constants: { INITIAL_CASH_BALANCE, SALT_ROUNDS },
      email: 'admin@stockmarket.com',
      username: 'admin',
      password:  'Test@123',
      role: 'admin'
    });
    await initializeNormalUser({
      pool,
      log,
      constants: { INITIAL_CASH_BALANCE, SALT_ROUNDS },
      email: 'user1@stockmarket.com',
      username: 'user1',
      password: 'Test@123',
      role: 'user'
    });
        await initializeNormalUser({
      pool,
      log,
      constants: { INITIAL_CASH_BALANCE, SALT_ROUNDS },
      email: 'aaa@gmail.com',
      username: 'aaa',
      password: '123456@Aa',
      role: 'user'
    });
            await initializeNormalUser({
      pool,
      log,
      constants: { INITIAL_CASH_BALANCE, SALT_ROUNDS },
      email: 'abcd@gmail.com',
      username: 'abcd',
      password: '123456@Aa',
      role: 'user'
    });
    app.listen(port, () => {
      log.info(`Server is running on port ${port}`);
      log.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
};

startServer()
  .then(() => {
    // Server started successfully
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
  });