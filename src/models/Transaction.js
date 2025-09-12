import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  schemeCode: {
    type: Number,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true,
    index: true
  },
  units: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerUnit: {
    type: Number, // NAV at the time of transaction
    required: true,
    min: 0
  },
  amount: {
    type: Number, // Total transaction amount
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  navUsed: {
    type: Number, // NAV used for calculation
    required: true,
    min: 0
  },
  // Optional fields for additional tracking
  realizedPL: {
    type: Number, // Only for SELL transactions
    default: 0
  },
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'COMPLETED',
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, schemeCode: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1, date: -1 });

// Static method to get user transactions
TransactionSchema.statics.getUserTransactions = function(userId, options = {}) {
  const { 
    schemeCode, 
    type, 
    startDate, 
    endDate, 
    page = 1, 
    limit = 50,
    sortBy = 'date',
    sortOrder = -1 
  } = options;
  
  const query = { userId };
  
  if (schemeCode) query.schemeCode = schemeCode;
  if (type) query.type = type;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);
};

// Static method to get transaction summary for a user
TransactionSchema.statics.getUserTransactionSummary = async function(userId) {
  const pipeline = [
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$type',
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalUnits: { $sum: '$units' }
      }
    }
  ];
  
  const results = await this.aggregate(pipeline);
  
  const summary = {
    totalBuys: 0,
    totalSells: 0,
    totalBuyAmount: 0,
    totalSellAmount: 0,
    totalBuyUnits: 0,
    totalSellUnits: 0
  };
  
  results.forEach(result => {
    if (result._id === 'BUY') {
      summary.totalBuys = result.totalTransactions;
      summary.totalBuyAmount = result.totalAmount;
      summary.totalBuyUnits = result.totalUnits;
    } else if (result._id === 'SELL') {
      summary.totalSells = result.totalTransactions;
      summary.totalSellAmount = result.totalAmount;
      summary.totalSellUnits = result.totalUnits;
    }
  });
  
  return summary;
};

// Method to calculate transaction profit/loss (for display purposes)
TransactionSchema.methods.calculatePL = function(currentNav) {
  if (this.type === 'BUY') {
    return (currentNav - this.pricePerUnit) * this.units;
  } else {
    return this.realizedPL || 0;
  }
};

const Transaction = mongoose.model('Transaction', TransactionSchema);

export default Transaction;
