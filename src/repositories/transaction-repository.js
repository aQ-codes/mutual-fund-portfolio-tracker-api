import Transaction from '../models/transaction.js';
import Portfolio from '../models/portfolio.js';

class TransactionRepository {
  /**
   * Create new transaction
   */
  static async create(transactionData) {
    try {
      const transaction = new Transaction(transactionData);
      return await transaction.save();
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Find transactions by portfolio ID
   */
  static async findByPortfolioId(portfolioId, options = {}) {
    try {
      const { page = 1, limit = 50, sortBy = 'date', sortOrder = -1 } = options;
      const skip = (page - 1) * limit;

      return await Transaction.find({ portfolioId })
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit);
    } catch (error) {
      console.error('Error finding transactions by portfolio ID:', error);
      throw error;
    }
  }

  /**
   * Get user transaction history
   */
  static async getUserTransactionHistory(userId, schemeCode = null, options = {}) {
    try {
      const { page = 1, limit = 50 } = options;
      const skip = (page - 1) * limit;

      let query = {};
      
      if (schemeCode) {
        const portfolio = await Portfolio.findOne({ userId, schemeCode });
        if (!portfolio) {
          return [];
        }
        query.portfolioId = portfolio._id;
      } else {
        const portfolios = await Portfolio.find({ userId });
        const portfolioIds = portfolios.map(p => p._id);
        query.portfolioId = { $in: portfolioIds };
      }

      const transactions = await Transaction.find(query)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .populate('portfolioId');

      return transactions;
    } catch (error) {
      console.error('Error getting user transaction history:', error);
      throw error;
    }
  }

  /**
   * Get buy transactions for FIFO calculation
   */
  static async getBuyTransactionsForPortfolio(portfolioId) {
    try {
      return await Transaction.find({
        portfolioId,
        type: 'BUY'
      }).sort({ date: 1 }); // Oldest first for FIFO
    } catch (error) {
      console.error('Error getting buy transactions for portfolio:', error);
      throw error;
    }
  }

  /**
   * Get sell transactions for FIFO calculation
   */
  static async getSellTransactionsForPortfolio(portfolioId) {
    try {
      return await Transaction.find({
        portfolioId,
        type: 'SELL'
      }).sort({ date: 1 }); // Oldest first for FIFO
    } catch (error) {
      console.error('Error getting sell transactions for portfolio:', error);
      throw error;
    }
  }

  /**
   * Count transactions by portfolio ID
   */
  static async countByPortfolioId(portfolioId) {
    try {
      return await Transaction.countDocuments({ portfolioId });
    } catch (error) {
      console.error('Error counting transactions by portfolio ID:', error);
      throw error;
    }
  }

  /**
   * Get all transactions with pagination (admin)
   */
  static async getAllWithPagination(options = {}) {
    try {
      const { page = 1, limit = 50, sortBy = 'date', sortOrder = -1 } = options;
      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        Transaction.find()
          .populate('portfolioId')
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(limit)
          .lean(),
        Transaction.countDocuments()
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        transactions,
        pagination: {
          currentPage: page,
          totalPages,
          totalTransactions: total,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting transactions with pagination:', error);
      throw error;
    }
  }

  /**
   * Count total transactions
   */
  static async countAll() {
    try {
      return await Transaction.countDocuments();
    } catch (error) {
      console.error('Error counting all transactions:', error);
      throw error;
    }
  }

  /**
   * Get recent transactions (admin)
   */
  static async getRecentTransactions(limit = 10) {
    try {
      return await Transaction.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('portfolioId')
        .lean();
    } catch (error) {
      console.error('Error getting recent transactions:', error);
      throw error;
    }
  }

  /**
   * Get transactions by date range
   */
  static async getByDateRange(startDate, endDate, options = {}) {
    try {
      const { page = 1, limit = 50 } = options;
      const skip = (page - 1) * limit;

      return await Transaction.find({
        date: {
          $gte: startDate,
          $lte: endDate
        }
      })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .populate('portfolioId');
    } catch (error) {
      console.error('Error getting transactions by date range:', error);
      throw error;
    }
  }
}

export default TransactionRepository;
