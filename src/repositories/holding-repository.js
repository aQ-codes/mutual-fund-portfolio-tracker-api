import Holding from '../models/holding.js';

class HoldingRepository {
  /**
   * Find holding by portfolio ID and scheme code
   */
  static async findByPortfolioAndScheme(portfolioId, schemeCode) {
    try {
      return await Holding.findOne({ portfolioId, schemeCode });
    } catch (error) {
      console.error('Error finding holding by portfolio and scheme:', error);
      throw error;
    }
  }

  /**
   * Create new holding
   */
  static async create(holdingData) {
    try {
      const holding = new Holding(holdingData);
      return await holding.save();
    } catch (error) {
      console.error('Error creating holding:', error);
      throw error;
    }
  }

  /**
   * Update holding
   */
  static async updateByPortfolioAndScheme(portfolioId, schemeCode, updateData) {
    try {
      return await Holding.updateOne(
        { portfolioId, schemeCode },
        { ...updateData, updatedAt: new Date() }
      );
    } catch (error) {
      console.error('Error updating holding:', error);
      throw error;
    }
  }

  /**
   * Delete holding by portfolio ID and scheme code
   */
  static async deleteByPortfolioAndScheme(portfolioId, schemeCode) {
    try {
      return await Holding.deleteOne({ portfolioId, schemeCode });
    } catch (error) {
      console.error('Error deleting holding:', error);
      throw error;
    }
  }

  /**
   * Find all holdings by portfolio ID
   */
  static async findByPortfolioId(portfolioId) {
    try {
      return await Holding.find({ portfolioId });
    } catch (error) {
      console.error('Error finding holdings by portfolio ID:', error);
      throw error;
    }
  }

  /**
   * Get holdings with positive units
   */
  static async getActiveHoldings(portfolioId) {
    try {
      return await Holding.find({ 
        portfolioId, 
        totalUnits: { $gt: 0 } 
      });
    } catch (error) {
      console.error('Error getting active holdings:', error);
      throw error;
    }
  }

  /**
   * Update holding after buy transaction
   */
  static async updateAfterBuy(portfolioId, schemeCode, units, nav) {
    try {
      const existingHolding = await this.findByPortfolioAndScheme(portfolioId, schemeCode);
      
      if (existingHolding) {
        // Calculate new weighted average NAV
        const totalInvestedValue = existingHolding.investedValue + (units * nav);
        const totalUnits = existingHolding.totalUnits + units;
        const newAvgNav = totalInvestedValue / totalUnits;

        return await this.updateByPortfolioAndScheme(portfolioId, schemeCode, {
          totalUnits,
          avgNav: newAvgNav,
          investedValue: totalInvestedValue
        });
      } else {
        // Create new holding
        return await this.create({
          portfolioId,
          schemeCode,
          totalUnits: units,
          avgNav: nav,
          investedValue: units * nav
        });
      }
    } catch (error) {
      console.error('Error updating holding after buy:', error);
      throw error;
    }
  }

  /**
   * Update holding after sell transaction
   */
  static async updateAfterSell(portfolioId, schemeCode, unitsSold) {
    try {
      const holding = await this.findByPortfolioAndScheme(portfolioId, schemeCode);
      
      if (!holding) {
        throw new Error('Holding not found');
      }

      const remainingUnits = holding.totalUnits - unitsSold;
      
      if (remainingUnits <= 0) {
        // Delete holding if no units left
        return await this.deleteByPortfolioAndScheme(portfolioId, schemeCode);
      } else {
        // Update holding - avgNav remains same, only units and invested value change
        const newInvestedValue = remainingUnits * holding.avgNav;
        
        return await this.updateByPortfolioAndScheme(portfolioId, schemeCode, {
          totalUnits: remainingUnits,
          investedValue: newInvestedValue
        });
      }
    } catch (error) {
      console.error('Error updating holding after sell:', error);
      throw error;
    }
  }

  /**
   * Get all holdings with pagination (admin)
   */
  static async getAllWithPagination(options = {}) {
    try {
      const { page = 1, limit = 20, sortBy = 'totalUnits', sortOrder = -1 } = options;
      const skip = (page - 1) * limit;

      const [holdings, total] = await Promise.all([
        Holding.find()
          .populate('portfolioId')
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(limit)
          .lean(),
        Holding.countDocuments()
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        holdings,
        pagination: {
          currentPage: page,
          totalPages,
          totalHoldings: total,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting holdings with pagination:', error);
      throw error;
    }
  }

  /**
   * Count holdings by criteria
   */
  static async countByCriteria(criteria = {}) {
    try {
      return await Holding.countDocuments(criteria);
    } catch (error) {
      console.error('Error counting holdings:', error);
      throw error;
    }
  }

  /**
   * Get holdings by scheme code (admin)
   */
  static async getBySchemeCode(schemeCode) {
    try {
      return await Holding.find({ schemeCode })
        .populate('portfolioId')
        .lean();
    } catch (error) {
      console.error('Error getting holdings by scheme code:', error);
      throw error;
    }
  }
}

export default HoldingRepository;
