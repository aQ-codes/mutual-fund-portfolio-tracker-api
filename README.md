# Mutual Fund Portfolio Tracker API

A comprehensive backend system for tracking mutual fund investments in the Indian financial market. Built with Node.js, Express.js, and MongoDB, this API provides real-time NAV data integration, portfolio management, and automated daily updates.

## 🚀 Features

### Core Functionality
- **User Authentication**: JWT-based secure authentication system
- **Portfolio Management**: Add, track, and manage mutual fund investments
- **Real-time NAV Data**: Integration with external Indian Mutual Fund APIs
- **Profit/Loss Calculation**: FIFO-based accounting with accurate P&L tracking
- **Historical Data**: Portfolio performance tracking over time
- **Automated Updates**: Daily NAV updates via cron jobs

### Admin Features
- **User Management**: View and manage all registered users
- **System Analytics**: Comprehensive statistics and insights
- **Popular Funds**: Track most invested mutual fund schemes
- **Cron Job Management**: Monitor and control automated tasks

### Technical Features
- **Modular Architecture**: Clean separation of concerns
- **Input Validation**: Comprehensive request validation with Joi
- **Error Handling**: Graceful error handling with proper HTTP status codes
- **Rate Limiting**: API protection against abuse
- **Caching Strategy**: Efficient NAV data caching
- **Graceful Shutdown**: Proper cleanup of resources and cron jobs

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs for password hashing
- **HTTP Client**: Axios for external API calls
- **Scheduling**: node-cron for automated tasks
- **Validation**: Joi for request validation
- **Environment**: dotenv for configuration management

## 📋 Prerequisites

- **Node.js**: v16.0.0 or higher
- **MongoDB**: v4.4 or higher (local or MongoDB Atlas)
- **Yarn**: v1.22.0 or higher (preferred package manager)
- **Git**: For version control

## 🚦 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mutual-fund-portfolio-tracker-api
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/mutual-fund-tracker

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters
JWT_EXPIRES_IN=24h

# External API Configuration
MFAPI_BASE_URL=https://api.mfapi.in/mf

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX=5
PORTFOLIO_RATE_LIMIT_MAX=10

# Cron Jobs Configuration
CRON_SCHEDULE=0 0 * * *
```

### 4. Database Setup

Start MongoDB service:

```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas connection string in MONGODB_URI
```

### 5. Seed Fund Data

```bash
# Seed initial fund data
yarn seed:funds

# Or seed with historical data (takes longer)
yarn seed:funds:full

# Clear existing data and reseed
yarn seed:funds:clear
```

### 6. Start the Server

```bash
# Development mode (with hot reload)
yarn dev

# Production mode
yarn start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://your-domain.com/api`

### Authentication

All portfolio and admin endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints Overview

#### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

#### Funds
- `GET /api/funds` - Get all mutual funds (with search and pagination)
- `GET /api/funds/:schemeCode/nav` - Get fund NAV history

#### Portfolio
- `POST /api/portfolio/add` - Add fund to portfolio
- `GET /api/portfolio/value` - Get portfolio value with P&L
- `GET /api/portfolio/list` - Get portfolio holdings
- `GET /api/portfolio/history` - Get portfolio performance history
- `DELETE /api/portfolio/remove/:schemeCode` - Remove fund from portfolio

#### Admin (Requires admin role)
- `GET /api/admin/users` - List all users
- `GET /api/admin/portfolios` - View all portfolios
- `GET /api/admin/popular-funds` - Most invested funds
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/cron-status` - Cron job status
- `POST /api/admin/cron/run-nav-update` - Manual NAV update

#### System
- `GET /health` - Health check
- `GET /api` - API information

### Sample Requests

#### User Registration
```bash
curl -X POST http://localhost:5000/api/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

#### Add Fund to Portfolio
```bash
curl -X POST http://localhost:5000/api/portfolio/add \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <your-jwt-token>" \\
  -d '{
    "schemeCode": 152075,
    "units": 100.5
  }'
```

#### Get Portfolio Value
```bash
curl -X GET http://localhost:5000/api/portfolio/value \\
  -H "Authorization: Bearer <your-jwt-token>"
```

## 🧪 Testing with Postman

We provide a complete Postman collection for easy API testing:

### Import Collection
1. Open Postman
2. Import files from `/postman/` directory:
   - `Mutual_Fund_Portfolio_Tracker_API.postman_collection.json`
   - `Development.postman_environment.json`

### Testing Workflow
1. **Setup**: Select "Development" environment
2. **Auth**: Run "User Signup" or "User Login"
3. **Funds**: Get fund list and NAV data
4. **Portfolio**: Add funds and check portfolio value
5. **Admin**: Test admin endpoints (requires admin role)

See `/postman/README.md` for detailed testing instructions.

## 🏗️ Project Structure

```
mutual-fund-portfolio-tracker-api/
├── src/
│   ├── api/                    # External API integrations
│   ├── config/                 # Configuration files
│   ├── controllers/            # Route handlers
│   │   ├── admin/              # Admin controllers
│   │   └── auth/               # Auth controllers
│   ├── exceptions/             # Custom error classes
│   ├── helpers/                # Business logic helpers
│   ├── middlewares/            # Express middlewares
│   ├── models/                 # MongoDB models
│   ├── repositories/           # Data access layer
│   ├── requests/               # Input validation
│   │   └── admin/              # Admin request validators
│   ├── responses/              # Response formatters
│   ├── routes/                 # Route definitions
│   ├── services/               # Business services
│   └── utils/                  # Utility functions
├── postman/                    # Postman collection
├── package.json                # Dependencies and scripts
├── server.js                   # Application entry point
└── README.md                   # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |
| `MONGODB_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRES_IN` | Token expiration time | 24h |
| `CRON_SCHEDULE` | NAV update schedule | 0 0 * * * |
| `RATE_LIMIT_MAX_REQUESTS` | API rate limit | 100/min |

### Cron Schedule Examples

```env
# Daily at midnight IST
CRON_SCHEDULE=0 0 * * *

# Daily at 1 AM IST
CRON_SCHEDULE=0 1 * * *

# Weekdays only at midnight
CRON_SCHEDULE=0 0 * * 1-5

# Every 6 hours
CRON_SCHEDULE=0 */6 * * *
```

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (user/admin)
- Password hashing with bcryptjs (12 rounds)
- Token expiration handling

### Input Validation
- Comprehensive request validation with Joi
- SQL injection prevention
- XSS protection through input sanitization

### Rate Limiting
- General API: 100 requests/minute per user
- Login attempts: 5 attempts/minute per IP
- Portfolio updates: 10 requests/minute per user

### Security Headers
- CORS configuration
- Secure password requirements
- Environment-based error messages

## 📈 Monitoring & Logging

### Cron Job Monitoring
- Daily NAV update status logging
- Batch processing with error tracking
- Graceful failure handling with retry logic

### System Health
- Database connection monitoring
- External API availability checks
- Cron job status tracking

### Error Logging
- Comprehensive error logging
- Development vs production error messages
- Request/response logging for debugging

## 🚀 Deployment

### Local Development
```bash
yarn dev  # Starts with nodemon for hot reload
```

### Production Deployment

1. **Environment Setup**:
   ```bash
   NODE_ENV=production
   MONGODB_URI=<production-mongodb-url>
   JWT_SECRET=<secure-secret-key>
   ```

2. **Build & Start**:
   ```bash
   yarn install --production
   yarn start
   ```

3. **Process Management** (PM2):
   ```bash
   npm install -g pm2
   pm2 start server.js --name "mf-portfolio-api"
   pm2 save
   pm2 startup
   ```

### Deployment Platforms

#### Render
1. Connect GitHub repository
2. Set environment variables
3. Deploy with automatic builds

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project directory
3. Configure environment variables

#### Railway
1. Connect GitHub repository
2. Configure environment variables
3. Deploy with automatic builds

## 🧪 Testing

### Manual Testing
Use the provided Postman collection for comprehensive API testing.

### Automated Testing (Future Enhancement)
```bash
# Unit tests
yarn test

# Integration tests
yarn test:integration

# Coverage report
yarn test:coverage
```

## 🔄 Data Flow

### NAV Update Process
1. **Cron Trigger**: Daily at configured time
2. **Portfolio Scan**: Get unique scheme codes from all portfolios
3. **Batch Processing**: Fetch NAVs in batches with rate limiting
4. **Database Update**: Update latest NAV and historical data
5. **Error Handling**: Log failures and send notifications

### Portfolio Calculation
1. **FIFO Accounting**: First-in-first-out for buy/sell operations
2. **Real-time NAV**: Fetch current NAV for value calculation
3. **P&L Calculation**: Compare current value with invested amount
4. **Historical Tracking**: Store daily portfolio values

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Commit Message Format
Follow conventional commits:
```
feat(scope): description
fix(scope): description
docs(scope): description
test(scope): description
```

### Code Style
- Use ESLint configuration
- Follow modular architecture patterns
- Write meaningful variable/function names
- Add JSDoc comments for functions

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
```
Error: MongoNetworkError
Solution: Check MongoDB service and connection string
```

#### JWT Errors
```
Error: JsonWebTokenError
Solution: Verify JWT_SECRET and token format
```

#### NAV Update Failures
```
Error: External API timeout
Solution: Check internet connection and API availability
```

#### Port Already in Use
```
Error: EADDRINUSE
Solution: Kill process or change PORT in .env
```

### Debug Mode
```bash
DEBUG=* yarn dev  # Enable all debug logs
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review API documentation
- Test with provided Postman collection

## 🙏 Acknowledgments

- **MFAPI**: External Indian Mutual Fund API provider
- **SEBI**: Securities and Exchange Board of India for market data
- **MongoDB**: Database platform
- **Node.js Community**: For excellent tooling and packages

---

**Built with ❤️ for the Indian fintech ecosystem**
