# Project Architecture Design

This document outlines the folder structure and architecture of our Stock Trading Platform project, covering both backend and frontend components.

# Backend (Node.js/Express)

The backend follows a modular architecture with clear separation of concerns:

```plaintext
backend/
├── src/
│   ├── config/
│   │   ├── constants.js
│   │   ├── dbConnect.js
│   │   ├── passportConfig.js
│   │   └── create[Table]Table.js files
│   ├── controllers/
│   │   ├── orderBookController.js
│   │   ├── orderController.js
│   │   ├── paymentControllers.js
│   │   ├── portfolioController.js
│   │   ├── stockPriceController.js
│   │   ├── tradingSessionController.js
│   │   ├── transactionController.js
│   │   └── userControllers.js
│   ├── middlewares/
│   │   ├── authenticationMiddleware.js
│   │   ├── errorHandlerMiddleware.js
│   │   ├── orderMiddleware.js
│   │   ├── responseSanitizationMiddleware.js
│   │   ├── roleBasedAccessControlMiddleware.js
│   │   ├── tradingSessionMiddleware.js
│   │   └── userValidationMiddleware.js
│   ├── models/
│   │   ├── holdingModel.js
│   │   ├── orderModel.js
│   │   ├── otpModel.js
│   │   ├── portfolioModel.js
│   │   ├── stockModel.js
│   │   ├── stockPriceModel.js
│   │   ├── transactionModel.js
│   │   └── userModel.js
│   ├── routes/
│   │   ├── orderRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── portfolioRoutes.js
│   │   ├── stockPriceRoutes.js
│   │   ├── stockRoutes.js
│   │   ├── tradingSessionRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   ├── holdingCRUDService.js
│   │   ├── orderCRUDService.js
│   │   ├── orderMatchingService.js
│   │   ├── orderSettlementService.js
│   │   ├── paymentService.js
│   │   ├── portfolioCRUDService.js
│   │   ├── security/
│   │   │   ├── otpService.js
│   │   │   ├── rememberedDeviceService.js
│   │   │   ├── turnstileService.js
│   │   │   └── userAuthService.js
│   │   ├── stockCRUDService.js
│   │   ├── stockPriceCRUDService.js
│   │   ├── tradingSessionService.js
│   │   ├── transactionCRUDService.js
│   │   └── userCRUDService.js
│   ├── utils/
│   │   ├── initUserUtil.js
│   │   ├── jwtUtil.js
│   │   ├── loggerUtil.js
│   │   ├── passwordUtil.js
│   │   ├── setCookieUtil.js
│   │   └── seedStockPrice/
│   │       ├── stock_fetcher.py
│   │       └── stockManager.js
│   └── index.js
├── Dockerfile
├── package.json
└── testAPI.http
```

## Backend Components Explanation

The typical workflow of an NodeJS backend will be as follow:

> index.js → routes → (middlewares) → controllers → services → models → services → controllers → (middlewares) → response to client.

More specific:

`index.js` listens for incoming requests and directs them to the appropriate route  &rarr; The route handler is called, which is defined in the `routes` directory. The route handler specifies the endpoint and the HTTP method (GET, POST, PUT, DELETE) &rarr; The route then calls the corresponding controller function  &rarr; The request might go through some middleware functions (e.g., validation, logging) in the `middlewares` folder before reaching the controller  &rarr; The controller function  (see `controllers` folder) takes in the request, then passes parameters to service functions, which perform the actual business logic  &rarr; The service functions, see `services` folder, may interact with the database model (see `models` folder)  &rarr; The controller receives the data from the service functions and processes it as needed  &rarr; Finally, the response (usually in **JSON format**) is sent back to the client.  


# Frontend (React/Vite)

The frontend follows a modern React application structure:

```plaintext
frontend/
├── src/
│   ├── api/
│   │   ├── apiClient.js
│   │   ├── orderBook.js
│   │   ├── payment.js
│   │   ├── portfolio.js
│   │   ├── sessionTrading.js
│   │   ├── stockPrice.js
│   │   ├── trade.js
│   │   └── user.js
│   ├── assets/
│   │   └── images/
│   ├── components/
│   │   ├── footer/
│   │   ├── forms/
│   │   │   ├── ForgotPasswordForm.jsx
│   │   │   ├── LoginForm.jsx
│   │   │   ├── OtpForm.jsx
│   │   │   └── RegisterForm.jsx
│   │   ├── header/
│   │   │   ├── AnnouncementBanner.jsx
│   │   │   └── Header.jsx
│   │   ├── Modal.jsx
│   │   └── RoleProtectedRoute.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── TradingSessionContext.jsx
│   ├── pages/
│   │   ├── Admin/
│   │   ├── Home/
│   │   │   └── HomeComponents/
│   │   ├── Portfolio/
│   │   │   └── PortfolioComponents/
│   │   ├── Trade/
│   │   ├── Tutorial/
│   │   └── NotFound/
│   ├── services/
│   │   └── eventEmitter.js
│   ├── styles/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── Dockerfile
├── index.html
├── nginx.conf
├── package.json
└── vite.config.js
```

## Frontend Components Explanation

### 1. api/
**Purpose:** API integration layer.
- Centralizes all API calls to backend
- Organizes endpoints by feature
- Handles API response formatting

### 2. assets/
**Purpose:** Static assets storage.
- Images
- Icons
- Other media files

### 3. components/
**Purpose:** Reusable UI components.
- Forms (Login, Register, OTP)
- Layout components (Header, Footer)
- Common UI elements (Modal, which is a blurred background to display pop-up content abouve it)
- Forms for user interactions: 
  - `ForgotPasswordForm.jsx`
  - `LoginForm.jsx`
  - `OtpForm.jsx`
  - `RegisterForm.jsx`
### 4. context/
**Purpose:** React Context providers, acts as a global state management that can be used across the application.

- Authentication state management
- Trading session state management

### 5. pages/
**Purpose:** Page-level components.
- Feature-specific pages (Admin, Home, Trade) 
- Each page can have its own sub-components for better organization


### 6. services/
**Purpose:** Frontend services.
- Event emitter for real-time updates with SSE (Server-Sent Events), this method will need to be setup in both backend and frontend.

### 7. styles/
**Purpose:** Global styles and themes.


### 8. utils/
**Purpose:** Helper functions.
- Password validation
- Data formatting
- Common utilities

---

## Development Tools

- `Dockerfile`: Container configuration for each service
- `nginx.conf`: Nginx configuration as a reverse proxy connecting frontend and backend
- `vite.config.js`: Vite bundler configuration
- `package.json`: Dependencies versioning
- `testAPI.http`: API testing file (Deprecated, no longer update to match new API endpoints, some endpoints may not work as expected)
