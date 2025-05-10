> [!IMPORTANT]  
> Check lại file .env trước khi chạy, phần các thông số liên quan đến database để tránh gặp lỗi kết nối. Chú ý DB_HOST phải là:
> - localhost nếu chạy backend trên máy local (tức dùng postgres.exe hoặc docker-compose chỉ để chạy db). Lúc này cần chú ý thêm comment phần service backend và frontend trong docker-compose đi, chỉ để 2 service của db là postgres và pgadmin thôi. Mật khẩu db là admin nếu chạy bằng docker-compose. Ai chạy bằng postgres.exe thì tự thay đổi mật khẩu trong file .env cho phù hợp.
> - postgres nếu chạy backend trong docker-compose. Khi này chỉ cần docker-compose up là mọi thứ tự chạy, không cần cd app/backend, cd app/frontend, yarn start nữa.

 

# For frontend Dev

See the API specifications in the this [docs](app/backend/testAPI.http) folder to understand how to use the API. Install REST Client extension in your VSCode to run this file.

# Run the project

Make sure you have **Node.js**, **Yarn** and **Docker** installed on your machine.

1. Create a `.env` file under the root directory, see the content inside the `.env.example` file. You can copy the content from `.env.example` to `.env` and change the values accordingly.

2. Initialize the database by running docker-compose. This will create a PostgreSQL database and a pgAdmin instance:

    ```bash
    docker-compose up -d # -d is for detached mode, incase the database is not running, remove -d to see the logs
    # docker-compose down # to stop the database
    ```

    All related configurations like databse name, user, password, running port, etc. are definied by you in the `.env` file created in step 1. In case you do not change anything, you can now access the PgAdmin instance at `http://localhost:5050`, then setup PgAdmin to manage the Postgres database with GUI, see [setupInstruction](docs\setupInstructions\setupDatabase.md) for more detail.

3. Navigate to the backend directory and run the following command:

    ```bash
    cd app/backend
    yarn install # to install the dependencies
    yarn start # to start the server
    ```
4. Test the backend API by sending requests to the endpoints. You can use Postman or any other API testing tool. See [API specifications](docs\setupInstructions\setupPostmanRequests.md) for more detail.

# Dependencies

In this proejct, I use **Yarn** to manage dependencies. Some of the dependencies are:

- **Express**: to build RestFul API
- **dotenv**: to load environment variables
- **pg**: to connect to PostgreSQL database and do query
- **cors**: to enable CORS
- **joi**: schema validation, any request come to our controller will be validated by joi first
- **bcrypt**: to hash password
- **jsonwebtoken**: to create and verify JWT tokens

*CORS (Cross-Origin Resource Sharing) is a security feature implemented by web browsers to control how resources on a web page can be requested from another domain outside the domain from which the resource originated. The purpose of using CORS is to allow or restrict web applications running at one origin (domain) to access resources from a different origin. This is important for enabling secure cross-origin requests and data sharing between different domains.*


# Folder structure

```plaintext
stock-market-simulator/
|
├── app/                        # All application code here
│   ├── backend/ 
│   │   │── src/                   
│   │   │   ├── config/         # Stores configuration (e.g., database connection, environment variables)
│   │   │   ├── controllers/    # Receives requests -> passes them to the appropriate service -> returns response to the client
│   │   │   ├── middleware/     # Middleware functions (e.g., validation, logging, error handling)
│   │   │   ├── models/         # Defines objects schemas (e.g., user, stock, transaction)
│   │   │   ├── routes/         # Specifies API endpoints to call corresponding controller functions
│   │   │   ├── services/       # Called by cointroller to handle business logic 
│   │   │   └── index.js        # Entry point for the backend application
│   │   │
│   │   │── package.json        # Backend dependencies
│   │   └── yarn.lock           # Yarn lock file
|   | 
│   └── frontend/               # Contains all ReactJS frontend code
│       ├── public/             # Static assets like index.html
│       ├── src/                # Source code
│       │   ├── assets/         # Images, fonts, etc.
│       │   ├── components/     # Reusable UI pieces (e.g., buttons, stock cards).
│       │   ├── pages/          # Full pages (e.g., Stock List, User Dashboard)
│       │   ├── services/       # Functions to fetch data from the backend
│       │   ├── styles/         # CSS/SCSS files
│       │   ├── utils/          # Utility functions
│       │   ├── App.js          # Main app component
│       │   └── index.js        # Entry point
│       ├── tests/              # Frontend tests
│       └── package.json        # Frontend dependencies
| 
├── docs/                      
│   ├── design/                 # Usecase diagram, class diagram, database design, etc.
│   ├── setupInstruction/       # Instruction to setup database, requests in Postman, etc.
│   ├── api/                    # API specifications
│   └── reports/                # Project reports
|
├── scripts/                    # Holds scripts for automation (e.g., deployment, testing)
│   ├── deploy.sh               # Deployment script
│   └── test.sh                 # Test script
|
├── .github/                    # GitHub configurations
│   └── workflows/              # CI/CD workflows
│       ├── ci.yml              # Continuous integration
│       └── cd.yml              # Continuous deployment
|
├── .env                        # Environment variables file, this will not include in the version control, recreate it from .env.example
├── .env.example                # Example of environment variables file
├── docker-compose.yml         # Docker Compose file to setup PostgreSQL and pgAdmin
├── .gitignore                  
├── README.md                   
└── LICENSE                
```

# Backend Workflow Overview  

>index.js → routes → (middlewares) → controllers → services → models → services → controllers → (middlewares) → response to client.

For more detail:

`index.js` listens for incoming requests and directs them to the appropriate route  &rarr; The route handler is called, which is defined in the `routes` directory. The route handler specifies the endpoint and the HTTP method (GET, POST, PUT, DELETE) &rarr; The route then calls the corresponding controller function  &rarr; The request might go through some middleware functions (e.g., validation, logging) in the `middlewares` folder before reaching the controller  &rarr; The controller function takes in the request, then passes parameters to service functions to perform the actual business logic (see `controllers` folder)  &rarr; The service functions, see `services` folder, may interact with the database model (see `models` folder)  &rarr; The controller receives the data from the service functions and processes it as needed  &rarr; Finally, the response (usually in **JSON format**) is sent back to the client.  


# Branch strategy

- `main` Branch
    - Purpose: Holds production-ready, stable code.
    - Usage: Only fully tested and approved changes are merged here, typically from release or hotfix branches.

- `develop` Branch
    - Purpose: Acts as the integration branch for ongoing development.
    - Usage: Both frontend and backend teams merge their feature branches here to combine their work continuously, triggering CI/CD pipelines 

- `feature`/ Branches
    - Purpose: Short-lived branches for specific tasks or features.
    - Naming: Use prefixes to indicate the team (frontend or backend) then the features:  `features/frontend-<feature-name>` or `features/backend-<feature-name>`. For example, if the frontend team is working on a login feature, the branch name could be `feature/frontend-login`. If the backend team is working on authentication, the branch name could be `feature/backend-auth`. 
    
    - Workflow: Created from `develop`, worked on by one developer (or a small team if needed), and merged back into develop via pull requests (PRs)

- `release` Branches
    - Purpose: Prepare for a new production release.
    - Naming: Use a versioning system, e.g., `release/v1.0.0`.
    - Workflow: Created from `develop` when the code is ready for release. This branch is used for final testing and bug fixes before merging into `main`.

- `hotfix` Branches
    - Purpose: Quickly address critical issues in production.
    - Naming: Use a versioning system, e.g., `hotfix/v1.0.1`.
    - Workflow: Created from `main` to fix urgent bugs. After the fix, it is merged back into both `main` and `develop`.

&rarr; Each developer creates a `feature/` branch from `develop` for their assigned task. When the task is done, they create a pull request to merge their changes back into `develop`. Once the code is merged into `develop`, it can be tested and eventually `merged` into main when ready for production.