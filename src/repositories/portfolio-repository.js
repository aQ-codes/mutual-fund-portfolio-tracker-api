import Portfolio from '../models/portfolio.js';
import Holding from '../models/holding.js';
import Fund from '../models/funds.js';

class PortfolioRepository {
  /**
   * Find portfolio by user ID and scheme code
   */
  static async findByUserAndScheme(userId, schemeCode) {
    try {
      return await Portfolio.findOne({ userId, schemeCode });
    } catch (error) {
      console.error('Error finding portfolio by user and scheme:', error);
      throw error;
    }
  }

  /**
   * Create new portfolio
   */
  static async create(portfolioData) {
    try {
      const portfolio = new Portfolio(portfolioData);
      return await portfolio.save();
    } catch (error) {
      console.error('Error creating portfolio:', error);
      throw error;
    }
  }

  /**
   * Find all portfolios by user ID
   */
  static async findByUserId(userId) {
    try {
      return await Portfolio.find({ userId });
    } catch (error) {
      console.error('Error finding portfolios by user ID:', error);
      throw error;
    }
  }

  /**
   * Delete portfolio by ID
   */
  static async deleteById(portfolioId) {
    try {
      return await Portfolio.deleteOne({ _id: portfolioId });
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      throw error;
    }
  }

  /**
   * Get all portfolios with pagination (admin)
   */
  static async getAllWithPagination(options = {}) {
    try {
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = -1 } = options;
      const skip = (page - 1) * limit;

      const [portfolios, total] = await Promise.all([
        Portfolio.find()
          .populate('userId', 'name email')
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(limit)
          .lean(),
        Portfolio.countDocuments()
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        portfolios,
        pagination: {
          currentPage: page,
          totalPages,
          totalPortfolios: total,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting portfolios with pagination:', error);
      throw error;
    }
  }

  /**
   * Get distinct scheme codes from all portfolios
   */
  static async getDistinctSchemeCodes() {
    try {
      return await Portfolio.distinct('schemeCode');
    } catch (error) {
      console.error('Error getting distinct scheme codes:', error);
      throw error;
    }
  }

  /**
   * Count portfolios by criteria
   */
  static async countByCriteria(criteria = {}) {
    try {
      return await Portfolio.countDocuments(criteria);
    } catch (error) {
      console.error('Error counting portfolios:', error);
      throw error;
    }
  }

  /**
   * Get portfolio with holdings and fund details
   */
  static async getWithHoldingsAndFund(userId, schemeCode) {
    try {
      const portfolio = await this.findByUserAndScheme(userId, schemeCode);
      if (!portfolio) return null;

      const [holding, fund] = await Promise.all([
        Holding.findOne({ portfolioId: portfolio._id, schemeCode }),
        Fund.findOne({ schemeCode })
      ]);

      return {
        portfolio,
        holding,
        fund
      };
    } catch (error) {
      console.error('Error getting portfolio with holdings and fund:', error);
      throw error;
    }
  }

  /**
   * Get all user portfolios with holdings and fund details
   */
  static async getUserPortfoliosWithDetails(userId) {
    try {
      const portfolios = await this.findByUserId(userId);
      const result = [];

      for (const portfolio of portfolios) {
        const [holding, fund] = await Promise.all([
          Holding.findOne({ portfolioId: portfolio._id, schemeCode: portfolio.schemeCode }),
          Fund.findOne({ schemeCode: portfolio.schemeCode })
        ]);

        result.push({
          portfolio,
          holding,
          fund
        });
      }

      return result;
    } catch (error) {
      console.error('Error getting user portfolios with details:', error);
      throw error;
    }
  }
}

export default PortfolioRepository;
