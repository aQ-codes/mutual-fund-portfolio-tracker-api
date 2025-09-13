# Deployment Guide - Mutual Fund Portfolio Tracker API

## 🚀 Render Deployment

### Prerequisites
- GitHub repository with your code
- Render account (free tier available)
- MongoDB Atlas account (for production database)

### Step 1: Prepare Repository
1. **Merge Development to Main**:
   ```bash
   git checkout main
   git merge development
   git push origin main
   ```

2. **Verify Files**:
   - `render.yaml` - Deployment configuration
   - `package.json` - Dependencies and scripts
   - `server.js` - Application entry point
   - `.env.example` - Environment variables template

### Step 2: MongoDB Atlas Setup
1. **Create Cluster**:
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create new cluster (free tier M0)
   - Choose region closest to your users

2. **Database Access**:
   - Create database user with read/write permissions
   - Whitelist IP addresses (0.0.0.0/0 for Render)

3. **Connection String**:
   - Get connection string from Atlas
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/database`

### Step 3: Render Deployment
1. **Connect Repository**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**:
   - **Name**: `mutual-fund-portfolio-tracker-api`
   - **Environment**: `Node`
   - **Build Command**: `yarn install`
   - **Start Command**: `yarn start`
   - **Plan**: Free

3. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mutual_fund_tracker
   JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
   FRONTEND_URL=https://your-frontend-domain.com
   MFAPI_BASE_URL=https://api.mfapi.in/mf
   ADMIN_NAME=Admin
   ADMIN_EMAIL=admin@yourdomain.com
   ADMIN_PASSWORD=YourSecureAdminPassword123!
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=100
   LOGIN_RATE_LIMIT_MAX=5
   PORTFOLIO_RATE_LIMIT_MAX=10
   CRON_SCHEDULE=0 0 * * *
   ```

4. **Deploy**:
   - Click "Create Web Service"
   - Wait for build and deployment (5-10 minutes)
   - Note the generated URL (e.g., `https://mutual-fund-portfolio-tracker-api.onrender.com`)

### Step 4: Post-Deployment Setup
1. **Update Postman Production Environment**:
   - Update `base_url` in `Production.postman_environment.json`
   - Set to your Render deployment URL

2. **Test Deployment**:
   - Import updated Postman collection
   - Test key endpoints (health check, auth, portfolio)
   - Verify CORS is working for frontend integration

3. **Seed Initial Data** (Optional):
   - Use admin endpoints to seed fund data
   - Or run seeders manually via API calls

## 🔧 Environment Configuration

### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `MONGODB_URI` | Database connection | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `FRONTEND_URL` | Frontend domain for CORS | `https://your-app.com` |

### Optional Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `10000` (Render) |
| `MFAPI_BASE_URL` | External API URL | `https://api.mfapi.in/mf` |
| `CRON_SCHEDULE` | NAV update schedule | `0 0 * * *` |
| `RATE_LIMIT_MAX_REQUESTS` | API rate limit | `100` |

## 📊 Monitoring & Logs

### Render Dashboard
- **Logs**: View real-time application logs
- **Metrics**: Monitor CPU, memory, and response times
- **Deployments**: Track deployment history and status

### Health Checks
- **Endpoint**: `GET /api` - API information
- **Database**: Automatic connection monitoring
- **Cron Jobs**: Status via admin endpoints

### Error Monitoring
- **Logs**: Comprehensive error logging
- **Alerts**: Set up notifications for failures
- **Debugging**: Use development environment for detailed errors

## 🔄 CI/CD Pipeline

### Automatic Deployments
- **Trigger**: Push to main branch
- **Build**: Automatic `yarn install`
- **Deploy**: Zero-downtime deployment
- **Rollback**: Easy rollback to previous versions

### Manual Deployments
- **Render Dashboard**: Manual deploy button
- **CLI**: Render CLI for advanced users
- **GitHub Actions**: Custom CI/CD workflows

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check package.json scripts
# Verify all dependencies are listed
# Check for syntax errors in code
```

#### Database Connection
```bash
# Verify MongoDB Atlas connection string
# Check IP whitelist (0.0.0.0/0 for Render)
# Verify database user permissions
```

#### CORS Issues
```bash
# Update FRONTEND_URL environment variable
# Check CORS configuration in server.js
# Verify frontend domain is correct
```

#### Rate Limiting
```bash
# Adjust rate limit values in environment
# Check rate limit middleware configuration
# Monitor API usage patterns
```

### Debug Mode
```bash
# Enable debug logging
NODE_ENV=development

# Check logs in Render dashboard
# Use admin endpoints for system status
```

## 🔐 Security Considerations

### Production Security
- **JWT Secret**: Use strong, unique secret (32+ characters)
- **Database**: Use MongoDB Atlas with proper access controls
- **CORS**: Restrict to specific frontend domains
- **Rate Limiting**: Configure appropriate limits
- **Environment**: Never commit secrets to repository

### Monitoring
- **Logs**: Monitor for suspicious activity
- **Metrics**: Track API usage and performance
- **Alerts**: Set up notifications for errors
- **Updates**: Keep dependencies updated

## 📈 Scaling Considerations

### Free Tier Limits
- **Build Time**: 90 minutes/month
- **Sleep**: Service sleeps after 15 minutes of inactivity
- **Cold Start**: 30-60 seconds wake-up time
- **Bandwidth**: 100GB/month

### Upgrade Options
- **Starter Plan**: $7/month for always-on service
- **Standard Plan**: $25/month for better performance
- **Pro Plan**: $85/month for production workloads

### Performance Optimization
- **Database Indexing**: Optimize MongoDB queries
- **Caching**: Implement Redis for frequently accessed data
- **CDN**: Use CloudFlare for static assets
- **Load Balancing**: Multiple instances for high traffic

## 📞 Support

### Render Support
- **Documentation**: [Render Docs](https://render.com/docs)
- **Community**: [Render Community](https://community.render.com)
- **Status**: [Render Status](https://status.render.com)

### Application Support
- **Logs**: Check Render dashboard logs
- **Health**: Use `/api` endpoint for status
- **Admin**: Use admin endpoints for system info
- **Issues**: Create GitHub issues for bugs

---

**Ready to deploy? Follow the steps above and your API will be live in minutes! 🚀**
