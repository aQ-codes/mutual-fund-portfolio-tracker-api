# Database Schema - Mutual Fund Portfolio Tracker

## 📊 Overview

The application uses MongoDB with Mongoose ODM. The database is designed for efficient portfolio tracking with proper indexing and relationships.

## 🗄️ Collections

### 1. Users Collection
**Purpose**: Store user authentication and profile information

```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique, indexed),
  password: String (required, hashed),
  role: String (enum: ['user', 'admin'], default: 'user'),
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now)
}
```

**Indexes**:
- `email` (unique)
- `role`

**Validation**:
- Email format validation
- Password minimum 8 characters
- Name required

---

### 2. Funds Collection
**Purpose**: Store mutual fund information and metadata

```javascript
{
  _id: ObjectId,
  schemeCode: Number (required, unique, indexed),
  schemeName: String (required),
  fundHouse: String (required),
  category: String (required),
  subCategory: String,
  nav: Number (required, min: 0),
  lastUpdated: Date (default: Date.now),
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now)
}
```

**Indexes**:
- `schemeCode` (unique)
- `fundHouse`
- `category`
- `schemeName` (text search)

**Validation**:
- NAV must be positive number
- Scheme code must be 6-digit number
- All required fields must be present

---

### 3. Fund Latest NAV Collection
**Purpose**: Store current NAV values for quick access

```javascript
{
  _id: ObjectId,
  fundId: ObjectId (ref: 'Fund', required, unique, indexed),
  schemeCode: Number (required, unique, indexed),
  nav: Number (required, min: 0),
  date: Date (required, default: Date.now),
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now)
}
```

**Indexes**:
- `fundId` (unique)
- `schemeCode` (unique)
- `date` (descending)

**Validation**:
- NAV must be positive number
- Date must be valid
- One record per fund

---

### 4. Fund NAV History Collection
**Purpose**: Store historical NAV data for performance tracking

```javascript
{
  _id: ObjectId,
  fundId: ObjectId (ref: 'Fund', required, indexed),
  schemeCode: Number (required, indexed),
  history: [
    {
      nav: Number (required, min: 0),
      date: Date (required),
      _id: false
    }
  ],
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now)
}
```

**Indexes**:
- `fundId` (unique)
- `schemeCode` (unique)
- `history.date` (descending)

**Validation**:
- History array with nav and date
- NAV values must be positive
- Dates must be valid

---

### 5. Portfolios Collection
**Purpose**: Store user portfolio entries (one per user per fund)

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required, indexed),
  schemeCode: Number (required, indexed),
  purchaseDate: Date (required, default: Date.now),
  purchaseNav: Number (required, min: 0),
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now)
}
```

**Indexes**:
- `userId` + `schemeCode` (compound, unique)
- `userId`
- `schemeCode`

**Validation**:
- One portfolio per user per fund
- Purchase NAV must be positive
- Purchase date required

---

### 6. Holdings Collection
**Purpose**: Store detailed holding information with FIFO lots

```javascript
{
  _id: ObjectId,
  portfolioId: ObjectId (ref: 'Portfolio', required, indexed),
  userId: ObjectId (ref: 'User', required, indexed),
  schemeCode: Number (required, indexed),
  schemeName: String (required),
  totalUnits: Number (required, min: 0),
  investedValue: Number (required, min: 0),
  avgNav: Number (required, min: 0),
  lots: [
    {
      units: Number (required, min: 0),
      pricePerUnit: Number (required, min: 0),
      purchaseDate: Date (required),
      _id: false
    }
  ],
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now)
}
```

**Indexes**:
- `portfolioId` (unique)
- `userId`
- `schemeCode`

**Validation**:
- Total units must be non-negative
- Invested value must be non-negative
- Lots array with proper structure

---

### 7. Transactions Collection
**Purpose**: Store complete transaction history for audit trail

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', required, indexed),
  portfolioId: ObjectId (ref: 'Portfolio', required, indexed),
  schemeCode: Number (required, indexed),
  schemeName: String (required),
  type: String (enum: ['BUY', 'SELL'], required),
  units: Number (required, min: 0),
  nav: Number (required, min: 0),
  amount: Number (required, min: 0),
  realizedPL: Number (default: 0),
  date: Date (required, default: Date.now),
  createdAt: Date (default: Date.now),
  updatedAt: Date (default: Date.now)
}
```

**Indexes**:
- `userId`
- `portfolioId`
- `schemeCode`
- `date` (descending)
- `type`

**Validation**:
- Type must be BUY or SELL
- Units and amount must be positive
- NAV must be positive

---

## 🔗 Relationships

### User Relationships
```
User (1) ──→ (N) Portfolio
User (1) ──→ (N) Transaction
User (1) ──→ (N) Holding
```

### Fund Relationships
```
Fund (1) ──→ (1) FundLatestNav
Fund (1) ──→ (1) FundNavHistory
Fund (1) ──→ (N) Portfolio
Fund (1) ──→ (N) Transaction
```

### Portfolio Relationships
```
Portfolio (1) ──→ (1) Holding
Portfolio (1) ──→ (N) Transaction
```

## 📈 Data Flow

### Portfolio Creation Flow
1. **User adds fund** → Create Portfolio entry
2. **Calculate units** → Create Holding with lots
3. **Record transaction** → Create Transaction entry
4. **Update statistics** → Update fund popularity

### NAV Update Flow
1. **Cron job triggers** → Fetch latest NAVs
2. **Update FundLatestNav** → Store current NAV
3. **Add to FundNavHistory** → Store historical data
4. **Update portfolio values** → Recalculate holdings

### Sell Transaction Flow
1. **Validate holding** → Check available units
2. **FIFO calculation** → Determine lots to sell
3. **Update holding** → Reduce units and lots
4. **Record transaction** → Store sell details
5. **Calculate P&L** → Update realized profit/loss

## 🔍 Query Patterns

### Common Queries

#### Get User Portfolio
```javascript
// Get all holdings for a user
Holdings.find({ userId: ObjectId })
  .populate('portfolioId')
  .sort({ createdAt: -1 })
```

#### Get Fund Performance
```javascript
// Get NAV history for a fund
FundNavHistory.findOne({ schemeCode: Number })
  .sort({ 'history.date': -1 })
  .limit(30)
```

#### Get Transaction History
```javascript
// Get user's transaction history
Transactions.find({ userId: ObjectId })
  .sort({ date: -1 })
  .limit(50)
```

#### Portfolio Value Calculation
```javascript
// Calculate current portfolio value
Holdings.aggregate([
  { $match: { userId: ObjectId } },
  { $lookup: { from: 'fundlatestnavs', localField: 'schemeCode', foreignField: 'schemeCode', as: 'navData' } },
  { $project: { currentValue: { $multiply: ['$totalUnits', { $arrayElemAt: ['$navData.nav', 0] }] } } }
])
```

## 🚀 Performance Optimizations

### Indexing Strategy
- **Compound indexes** for multi-field queries
- **Unique indexes** for data integrity
- **Text indexes** for search functionality
- **TTL indexes** for data cleanup (if needed)

### Query Optimization
- **Selective field projection** to reduce data transfer
- **Pagination** for large result sets
- **Aggregation pipelines** for complex calculations
- **Caching** for frequently accessed data

### Data Management
- **Batch operations** for bulk updates
- **Connection pooling** for database efficiency
- **Graceful degradation** for external API failures
- **Data validation** at application level

## 🔧 Maintenance

### Regular Tasks
- **Index optimization** based on query patterns
- **Data cleanup** for old transactions (optional)
- **Performance monitoring** of slow queries
- **Backup verification** of critical data

### Monitoring
- **Query performance** via MongoDB profiler
- **Index usage** statistics
- **Collection sizes** and growth patterns
- **Connection pool** utilization

---

**This schema is optimized for the Indian mutual fund market with efficient portfolio tracking and real-time NAV updates.**
