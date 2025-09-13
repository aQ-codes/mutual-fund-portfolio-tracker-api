import mongoose from 'mongoose';

const FundNavHistorySchema = new mongoose.Schema({
  fundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fund',
    required: true,
    unique: true,
    index: true
  },
  schemeCode: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  history: [{
    nav: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      required: true
    },
    _id: false
  }]
}, {
  timestamps: true
});

// Index for efficient queries on history array
FundNavHistorySchema.index({ 'history.date': -1 }); // For date-based queries on history array

// Static method to get recent history by fundId (last N entries from history array)
FundNavHistorySchema.statics.getRecentHistoryByFundId = function(fundId, limit = 30) {
  return this.findOne({ fundId })
    .then(doc => {
      if (!doc || !doc.history) return [];
      return doc.history
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
    });
};

// Static method to get recent history by schemeCode (backward compatibility)
FundNavHistorySchema.statics.getRecentHistory = function(schemeCode, limit = 30) {
  return this.findOne({ schemeCode })
    .then(doc => {
      if (!doc || !doc.history) return [];
      return doc.history
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);
    });
};

// Static method to create or update NAV history for a fund (for seeding)
FundNavHistorySchema.statics.createOrUpdateHistory = async function(fundId, schemeCode, navHistoryArray) {
  return this.findOneAndUpdate(
    { fundId },
    { 
      fundId,
      schemeCode,
      $push: { 
        history: { 
          $each: navHistoryArray,
          $sort: { date: -1 }
        }
      }
    },
    { 
      upsert: true, 
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

// Static method to add single NAV entry (for cron job)
FundNavHistorySchema.statics.addNavEntry = async function(fundId, schemeCode, nav, date) {
  // Check if entry for this date already exists
  const existingDoc = await this.findOne({ 
    fundId,
    'history.date': date
  });

  if (existingDoc) {
    // Update existing entry
    return this.findOneAndUpdate(
      { fundId, 'history.date': date },
      { $set: { 'history.$.nav': nav } },
      { new: true }
    );
  } else {
    // Add new entry
    return this.findOneAndUpdate(
      { fundId },
      { 
        fundId,
        schemeCode,
        $push: { 
          history: { 
            $each: [{ nav, date }],
            $sort: { date: -1 }
          }
        }
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );
  }
};

// Backward compatibility method for bulk operations
FundNavHistorySchema.statics.bulkUpsertByFundId = async function(historyData) {
  // Group history data by fundId
  const groupedData = historyData.reduce((acc, item) => {
    if (!acc[item.fundId]) {
      acc[item.fundId] = {
        fundId: item.fundId,
        schemeCode: item.schemeCode,
        history: []
      };
    }
    acc[item.fundId].history.push({
      nav: item.nav,
      date: item.date
    });
    return acc;
  }, {});

  // Process each fund
  const operations = Object.values(groupedData).map(fundData => 
    this.createOrUpdateHistory(fundData.fundId, fundData.schemeCode, fundData.history)
  );

  return Promise.all(operations);
};

const FundNavHistory = mongoose.model('FundNavHistory', FundNavHistorySchema);

export default FundNavHistory;
