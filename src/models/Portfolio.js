import mongoose from 'mongoose';

// Schema for individual buy lots (for FIFO accounting)
const LotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  units: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerUnit: {
    type: Number, // NAV at the time of purchase
    required: true,
    min: 0
  }
}, { _id: false });

// Schema for individual holdings
const HoldingSchema = new mongoose.Schema({
  schemeCode: {
    type: Number,
    required: true,
    index: true
  },
  totalUnits: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  lots: [LotSchema] // Array of purchase lots for FIFO
}, { _id: false });

const PortfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  holdings: [HoldingSchema],
  transactions: [{
    type: {
      type: String,
      enum: ['BUY', 'SELL'],
      required: true
    },
    schemeCode: {
      type: Number,
      required: true
    },
    units: {
      type: Number,
      required: true
    },
    pricePerUnit: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    navUsed: {
      type: Number,
      required: true
    }
  }]
}, {
  timestamps: true
});

// Compound index for user portfolio queries
PortfolioSchema.index({ userId: 1, 'holdings.schemeCode': 1 });

// Static method to find user's portfolio
PortfolioSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

// Static method to get or create user portfolio
PortfolioSchema.statics.getOrCreatePortfolio = async function(userId) {
  let portfolio = await this.findOne({ userId });
  
  if (!portfolio) {
    portfolio = new this({
      userId,
      holdings: [],
      transactions: []
    });
    await portfolio.save();
  }
  
  return portfolio;
};

// Method to add units to a holding (buy operation)
PortfolioSchema.methods.addUnits = function(schemeCode, units, pricePerUnit, date = new Date()) {
  let holding = this.holdings.find(h => h.schemeCode === schemeCode);
  
  if (!holding) {
    // Create new holding
    holding = {
      schemeCode,
      totalUnits: 0,
      lots: []
    };
    this.holdings.push(holding);
  }
  
  // Add new lot
  holding.lots.push({
    date,
    units,
    pricePerUnit
  });
  
  // Update total units
  holding.totalUnits += units;
  
  // Add transaction record
  this.transactions.push({
    type: 'BUY',
    schemeCode,
    units,
    pricePerUnit,
    amount: units * pricePerUnit,
    date,
    navUsed: pricePerUnit
  });
  
  return this.save();
};

// Method to remove units from a holding (sell operation using FIFO)
PortfolioSchema.methods.removeUnits = function(schemeCode, unitsToSell, currentNav, date = new Date()) {
  const holding = this.holdings.find(h => h.schemeCode === schemeCode);
  
  if (!holding || holding.totalUnits < unitsToSell) {
    throw new Error('Insufficient units to sell');
  }
  
  let remainingToSell = unitsToSell;
  let realizedPL = 0;
  
  // FIFO: Remove from oldest lots first
  for (let i = 0; i < holding.lots.length && remainingToSell > 0; i++) {
    const lot = holding.lots[i];
    
    if (lot.units <= remainingToSell) {
      // Sell entire lot
      realizedPL += (currentNav - lot.pricePerUnit) * lot.units;
      remainingToSell -= lot.units;
      holding.lots.splice(i, 1);
      i--; // Adjust index after removal
    } else {
      // Partial lot sale
      realizedPL += (currentNav - lot.pricePerUnit) * remainingToSell;
      lot.units -= remainingToSell;
      remainingToSell = 0;
    }
  }
  
  // Update total units
  holding.totalUnits -= unitsToSell;
  
  // Remove holding if no units left
  if (holding.totalUnits === 0) {
    const holdingIndex = this.holdings.findIndex(h => h.schemeCode === schemeCode);
    this.holdings.splice(holdingIndex, 1);
  }
  
  // Add transaction record
  this.transactions.push({
    type: 'SELL',
    schemeCode,
    units: unitsToSell,
    pricePerUnit: currentNav,
    amount: unitsToSell * currentNav,
    date,
    navUsed: currentNav
  });
  
  return { portfolio: this.save(), realizedPL };
};

// Method to get holding by scheme code
PortfolioSchema.methods.getHolding = function(schemeCode) {
  return this.holdings.find(h => h.schemeCode === schemeCode);
};

// Method to calculate average cost for a holding
PortfolioSchema.methods.getAverageCost = function(schemeCode) {
  const holding = this.getHolding(schemeCode);
  
  if (!holding || holding.lots.length === 0) {
    return 0;
  }
  
  const totalValue = holding.lots.reduce((sum, lot) => sum + (lot.units * lot.pricePerUnit), 0);
  return totalValue / holding.totalUnits;
};

const Portfolio = mongoose.model('Portfolio', PortfolioSchema);

export default Portfolio;
