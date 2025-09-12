import mongoose from 'mongoose';

const FundHistorySchema = new mongoose.Schema({
  schemeCode: {
    type: Number,
    required: true,
    index: true
  },
  nav: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: String, // DD-MM-YYYY format as per API
    required: true,
    match: /^\d{2}-\d{2}-\d{4}$/
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
FundHistorySchema.index({ schemeCode: 1, date: -1 }, { unique: true });

// Static method to get history for a scheme within date range
FundHistorySchema.statics.getHistoryByDateRange = function(schemeCode, startDate, endDate) {
  const query = { schemeCode };
  
  if (startDate && endDate) {
    // For date range queries, we'll need to handle DD-MM-YYYY format
    query.date = { $gte: startDate, $lte: endDate };
  }
  
  return this.find(query).sort({ date: -1 });
};

// Static method to get recent history (last N days)
FundHistorySchema.statics.getRecentHistory = function(schemeCode, days = 30) {
  return this.find({ schemeCode })
    .sort({ date: -1 })
    .limit(days);
};

// Static method to bulk insert history data (for seeding)
FundHistorySchema.statics.bulkUpsert = async function(historyData) {
  const operations = historyData.map(item => ({
    updateOne: {
      filter: { schemeCode: item.schemeCode, date: item.date },
      update: { $set: item },
      upsert: true
    }
  }));
  
  return this.bulkWrite(operations);
};

const FundHistory = mongoose.model('FundHistory', FundHistorySchema);

export default FundHistory;
