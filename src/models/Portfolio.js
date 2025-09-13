import mongoose from 'mongoose';

const PortfolioSchema = new mongoose.Schema({
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
  purchaseDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  purchaseNav: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
PortfolioSchema.index({ userId: 1, schemeCode: 1 }, { unique: true }); // One portfolio per user per scheme

const Portfolio = mongoose.model('Portfolio', PortfolioSchema);

export default Portfolio;
