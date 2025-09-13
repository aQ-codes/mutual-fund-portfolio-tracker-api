import mongoose from 'mongoose';

const FundSchema = new mongoose.Schema({
  schemeCode: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  schemeName: {
    type: String,
    required: true,
    trim: true
  },
  isinGrowth: {
    type: String,
    trim: true,
    index: true
  },
  isinDivReinvestment: {
    type: String,
    trim: true,
    index: true
  },
  fundHouse: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  schemeType: {
    type: String,
    required: true,
    trim: true
  },
  schemeCategory: {
    type: String,
    required: true,
    trim: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
FundSchema.index({ fundHouse: 1, schemeCategory: 1 });
FundSchema.index({ schemeType: 1, schemeCategory: 1 });

// Virtual for latest NAV
FundSchema.virtual('latestNav', {
  ref: 'FundLatestNav',
  localField: '_id',
  foreignField: 'fundId',
  justOne: true
});

// Virtual for NAV history (last 30 entries)
FundSchema.virtual('navHistory', {
  ref: 'FundNavHistory',
  localField: '_id',
  foreignField: 'fundId',
  options: { sort: { date: -1 }, limit: 30 }
});

// Virtual for portfolios holding this fund
FundSchema.virtual('portfolios', {
  ref: 'Portfolio',
  localField: 'schemeCode',
  foreignField: 'schemeCode'
});

// Ensure virtual fields are serialized
FundSchema.set('toJSON', { virtuals: true });
FundSchema.set('toObject', { virtuals: true });

// Static method to search funds by name or fund house
FundSchema.statics.searchFunds = function(searchTerm, options = {}) {
  const { page = 1, limit = 20, sortBy = 'schemeName', sortOrder = 1 } = options;
  const skip = (page - 1) * limit;
  
  const searchRegex = new RegExp(searchTerm, 'i');
  const query = {
    $or: [
      { schemeName: searchRegex },
      { fundHouse: searchRegex },
      { schemeCategory: searchRegex }
    ]
  };
  
  return this.find(query)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit);
};

// Method to get fund summary
FundSchema.methods.getSummary = function() {
  return {
    schemeCode: this.schemeCode,
    schemeName: this.schemeName,
    fundHouse: this.fundHouse,
    schemeCategory: this.schemeCategory
  };
};

const Fund = mongoose.model('Fund', FundSchema);

export default Fund;
