import mongoose from 'mongoose';

const LatestNavSchema = new mongoose.Schema({
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
    type: String, // DD-MM-YYYY format as per API
    required: true,
    match: /^\d{2}-\d{2}-\d{4}$/
  }
}, {
  timestamps: true
});

// Static method to update or create latest NAV
LatestNavSchema.statics.updateNav = async function(schemeCode, nav, date) {
  return this.findOneAndUpdate(
    { schemeCode },
    { nav, date, updatedAt: new Date() },
    { upsert: true, new: true }
  );
};

// Static method to get NAV for multiple schemes
LatestNavSchema.statics.getNavForSchemes = function(schemeCodes) {
  return this.find({ schemeCode: { $in: schemeCodes } });
};

// Static method to bulk update NAVs (for cron job)
LatestNavSchema.statics.bulkUpdateNavs = async function(navData) {
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

const LatestNav = mongoose.model('LatestNav', LatestNavSchema);

export default LatestNav;
