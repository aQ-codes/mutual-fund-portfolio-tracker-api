# Mutual Fund Portfolio Tracker - Postman Collection

This directory contains the complete Postman collection and environments for testing the Mutual Fund Portfolio Tracker API with comprehensive test scenarios.

## 🚀 Features

- **Complete API Coverage**: All endpoints with multiple test scenarios
- **New Schema Support**: Three-collection architecture with avgNav calculations
- **Transaction Tracking**: Complete audit trail with FIFO P&L calculations
- **Multiple Examples**: Each request includes success and error cases
- **Automatic Token Management**: JWT tokens are automatically set after login
- **Environment Variables**: Separate development and production configs
- **Test Scripts**: Automatic validation of responses with new schema fields
- **Professional Structure**: Organized folders and descriptive naming

## 📁 Files

- `Mutual_Fund_Portfolio_Tracker_API.postman_collection.json` - Main API collection with examples
- `Development.postman_environment.json` - Development environment (localhost:5000)
- `Production.postman_environment.json` - Production environment template

## 🔗 Base URLs

- **Development**: `http://localhost:5000` (without /api suffix)
- **Production**: `https://your-production-domain.com` (without /api suffix)

All API endpoints are automatically prefixed with `/api` in the requests.

## Environment Setup

### Configure Admin Credentials
Before running the API, set up your environment variables in `.env`:

```bash
# Admin User Configuration (used by seeder)
ADMIN_NAME=Admin User
ADMIN_EMAIL=admin@mutualfund.com
ADMIN_PASSWORD=Admin@123456
```

The admin seeder will use these values to create the admin user. If not provided, it falls back to default values.

## Quick Start

### 1. Import Collection and Environment

1. Open Postman
2. Click **Import** button
3. Drag and drop all three JSON files or use **Choose Files**
4. Select the **Development** environment from the dropdown

### 2. Test Authentication Flow

#### User Signup Examples:
- ✅ **Success Case**: Valid user registration
- ❌ **Weak Password**: Password validation error
- ❌ **Invalid Email**: Email format validation  
- ❌ **Missing Fields**: Required field validation
- ❌ **Duplicate Email**: Email already exists error

#### User Login Examples:
- ✅ **Success Case**: Valid credentials
- ❌ **Wrong Password**: Invalid credentials error
- ❌ **User Not Found**: Non-existent user error
- ❌ **Missing Fields**: Required field validation

**How to Use Examples:**
1. Click on "User Signup" or "User Login" request
2. See multiple examples in the right panel
3. Click any example → "Try" → Opens in new tab
4. Click "Send" to test that scenario

### 3. Test Fund Operations

1. **Get All Funds**: Retrieve available mutual funds
   - Automatically sets `scheme_code` from first fund for other tests

2. **Search Funds**: Search for specific funds (e.g., "bluechip")

3. **Get Fund NAV**: Get current and historical NAV data

### 4. Test Portfolio Operations

1. **Add Fund to Portfolio**: Add a mutual fund investment
   - Uses the `scheme_code` variable set from fund operations

2. **Get Portfolio Value**: View current portfolio value with P&L

3. **Get Portfolio List**: View all holdings

4. **Get Portfolio History**: View performance over time

5. **Remove Fund**: Remove a fund from portfolio

### 5. Test Admin Operations (Requires Admin Role)

1. **Get All Users**: View all registered users
2. **Get All Portfolios**: View all user portfolios  
3. **Get Popular Funds**: View most invested funds
4. **Get System Statistics**: View system analytics
5. **Manual NAV Update**: Trigger NAV update manually

## Environment Variables

### Automatic Variables
These are set automatically by test scripts:

- `auth_token`: JWT token (set after login/signup)
- `user_id`: Current user ID (set after login/signup)
- `scheme_code`: Sample scheme code (set from fund list)

### Manual Variables
Set these in your environment:

- `base_url`: API base URL (default: http://localhost:5000/api)
- `admin_email`: Admin user email
- `admin_password`: Admin user password

## Test Data Examples

### Sample User Registration
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

### Sample Portfolio Addition
```json
{
  "schemeCode": 152075,
  "units": 100.5
}
```

### Sample Fund Search
- Query: `?search=bluechip&page=1&limit=10`
- Filters funds containing "bluechip" in name

## Authentication

The collection uses Bearer Token authentication:
- Login/Signup requests automatically capture and store JWT tokens
- Subsequent requests use the stored token automatically
- Admin endpoints require admin role in JWT payload

## Error Handling

All requests include basic test scripts that:
- Validate response status codes
- Check response structure
- Set environment variables on success
- Display meaningful error messages

## Testing Workflow

### For Regular Users:
1. Signup/Login → Get Funds → Add to Portfolio → View Portfolio Value

### For Admins:
1. Login as Admin → View Users → View System Stats → Manage Cron Jobs

### Complete Integration Test:
1. Create user account
2. Search and add multiple funds to portfolio
3. Check portfolio value and history
4. Admin views system statistics
5. Manual NAV update
6. Verify updated portfolio values

## Tips

- **Environment Setup**: Always select the correct environment before testing
- **Token Expiry**: Tokens expire after 24 hours - re-login if you get 401 errors
- **Admin Testing**: Create an admin user in database or modify user role manually
- **Scheme Codes**: Use valid scheme codes from the fund list (150507-153826 range)
- **Rate Limiting**: Be mindful of API rate limits during bulk testing

## Troubleshooting

### Common Issues:

1. **401 Unauthorized**: Token expired or missing - re-login
2. **403 Forbidden**: Admin endpoint accessed with user role
3. **404 Not Found**: Check base_url and endpoint paths
4. **500 Server Error**: Check server logs and database connection

### Environment Issues:

1. **Variables not set**: Check if login/signup completed successfully
2. **Wrong base_url**: Verify server is running on correct port
3. **Missing scheme_code**: Run "Get All Funds" request first

## Production Usage

When using the Production environment:

1. Update `base_url` with your production API URL
2. Set secure admin credentials
3. Remove or secure test data
4. Use HTTPS for all requests
5. Monitor rate limits more carefully

## Support

For API documentation and support:
- Check the main README.md in the project root
- Review server logs for detailed error information
- Verify database connection and seeded data
