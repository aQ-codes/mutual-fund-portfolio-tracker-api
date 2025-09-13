import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  portfolioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Portfolio',
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
  nav: {
    type: Number,
    required: true,
    min: 0
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
TransactionSchema.index({ portfolioId: 1, date: -1 });
TransactionSchema.index({ portfolioId: 1, type: 1, date: -1 });

const Transaction = mongoose.model('Transaction', TransactionSchema);

export default Transaction;
