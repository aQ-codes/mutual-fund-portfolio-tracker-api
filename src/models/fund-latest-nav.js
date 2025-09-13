import mongoose from 'mongoose';

const FundLatestNavSchema = new mongoose.Schema({
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
  nav: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Static method to update or create latest NAV by fundId
FundLatestNavSchema.statics.updateNavByFundId = async function(fundId, schemeCode, nav, date) {
  // First try to update by fundId
  let result = await this.findOneAndUpdate(
    { fundId },
    { fundId, schemeCode, nav, date, updatedAt: new Date() },
    { new: true }
  );

  if (!result) {
    // If no record with fundId exists, check if there's one with schemeCode
    const existingByScheme = await this.findOne({ schemeCode });
    if (existingByScheme) {
      // Update existing record with new fundId
      result = await this.findOneAndUpdate(
        { schemeCode },
        { fundId, schemeCode, nav, date, updatedAt: new Date() },
        { new: true }
      );
    } else {
      // Create new record
      result = await this.create({
        fundId, schemeCode, nav, date, updatedAt: new Date()
      });
    }
  }

  return result;
};

// Static method to update or create latest NAV by schemeCode (backward compatibility)
FundLatestNavSchema.statics.updateNav = async function(schemeCode, nav, date) {
  return this.findOneAndUpdate(
    { schemeCode },
    { nav, date, updatedAt: new Date() },
    { upsert: true, new: true }
  );
};

// Static method to get NAV for multiple fundIds
FundLatestNavSchema.statics.getNavForFunds = function(fundIds) {
  return this.find({ fundId: { $in: fundIds } });
};

// Static method to get NAV for multiple schemes (backward compatibility)
FundLatestNavSchema.statics.getNavForSchemes = function(schemeCodes) {
  return this.find({ schemeCode: { $in: schemeCodes } });
};

// Static method to bulk update NAVs by fundId (for cron job)
FundLatestNavSchema.statics.bulkUpdateNavsByFundId = async function(navData) {
  const operations = navData.map(item => ({
    updateOne: {
      filter: { fundId: item.fundId },
      update: { 
        $set: { 
          fundId: item.fundId,
          schemeCode: item.schemeCode,
          nav: item.nav, 
          date: item.date, 
          updatedAt: new Date() 
        } 
      },
      upsert: true
    }
  }));
  
  return this.bulkWrite(operations);
};

// Static method to bulk update NAVs (backward compatibility)
FundLatestNavSchema.statics.bulkUpdateNavs = async function(navData) {
  const operations = navData.map(item => ({
    updateOne: {
      filter: { schemeCode: item.schemeCode },
      update: { 
        $set: { 
          nav: item.nav, 
          date: item.date, 
          updatedAt: new Date() 
        } 
      },
      upsert: true
    }
  }));
  
  return this.bulkWrite(operations);
};

const FundLatestNav = mongoose.model('FundLatestNav', FundLatestNavSchema);

export default FundLatestNav;
