import mongoose from 'mongoose';

const HoldingSchema = new mongoose.Schema({
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
    required: true,
    index: true
  },
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
  avgNav: {
    type: Number,
    required: true,
    min: 0
  },
  investedValue: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
HoldingSchema.index({ portfolioId: 1, schemeCode: 1 }, { unique: true }); // One holding per portfolio per scheme

const Holding = mongoose.model('Holding', HoldingSchema);

export default Holding;
