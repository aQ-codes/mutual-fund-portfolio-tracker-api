import Portfolio from '../models/portfolio.js';
import Transaction from '../models/transaction.js';
import Holding from '../models/holding.js';
import Fund from '../models/funds.js';
import NavService from './nav-service.js';

/**
 * Portfolio Service
 * Handles all portfolio business logic that was previously in instance methods
 */
class PortfolioService {
  
  /**
   * Get or create a portfolio for a user and scheme
   * @param {ObjectId} userId - User ID
   * @param {Number} schemeCode - Scheme code
   * @returns {Object} Portfolio document
   */
  static async getOrCreatePortfolio(userId, schemeCode) {
    let portfolio = await Portfolio.findOne({ userId, schemeCode });
    
    if (!portfolio) {
      // Get the latest NAV for initial purchase
      const navData = await NavService.getLatestNav(schemeCode);
      if (!navData.success || !navData.data) {
        throw new Error('Unable to fetch NAV for fund');
      }

      portfolio = new Portfolio({
        userId,
        schemeCode,
        purchaseDate: new Date(),
        purchaseNav: navData.data.nav
      });
      await portfolio.save();
    }
    
    return portfolio;
  }

  /**
   * Add units to a portfolio (BUY transaction)
   * @param {ObjectId} userId - User ID
   * @param {Number} schemeCode - Scheme code
   * @param {Number} units - Units to buy
   * @param {Number} nav - NAV at purchase
   * @param {Date} date - Transaction date
   * @returns {Object} Transaction and updated holding
   */
  static async addUnits(userId, schemeCode, units, nav, date = new Date()) {
    // Get or create portfolio
    const portfolio = await this.getOrCreatePortfolio(userId, schemeCode);
    
    // Create transaction
    const transaction = new Transaction({
      portfolioId: portfolio._id,
      type: 'BUY',
      units,
      nav,
      amount: units * nav,
      date
    });
    await transaction.save();

    // Update or create holding
    await this.updateHoldingAfterBuy(portfolio._id, schemeCode, units, nav);

    return { transaction, portfolioId: portfolio._id };
  }

  /**
   * Remove units from a portfolio (SELL transaction)
   * @param {ObjectId} userId - User ID
   * @param {Number} schemeCode - Scheme code
   * @param {Number} unitsToSell - Units to sell
   * @param {Number} currentNav - Current NAV
   * @param {Date} date - Transaction date
   * @returns {Object} Transaction, updated holding, and realized P&L
   */
  static async removeUnits(userId, schemeCode, unitsToSell, currentNav, date = new Date()) {
    // Find portfolio
    const portfolio = await Portfolio.findOne({ userId, schemeCode });
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // Check current holding
    const holding = await Holding.findOne({ portfolioId: portfolio._id, schemeCode });
    if (!holding || holding.totalUnits < unitsToSell) {
      throw new Error('Insufficient units to sell');
    }

    // Calculate realized P&L using FIFO
    const realizedPL = await this.calculateFifoRealizedPL(portfolio._id, unitsToSell, currentNav);

    // Create sell transaction
    const transaction = new Transaction({
      portfolioId: portfolio._id,
      type: 'SELL',
      units: unitsToSell,
      nav: currentNav,
      amount: unitsToSell * currentNav,
      date
    });
    await transaction.save();

    // Update holding
    await this.updateHoldingAfterSell(portfolio._id, schemeCode, unitsToSell);

    return { transaction, realizedPL };
  }

  /**
   * Update holding after buy transaction
   * @param {ObjectId} portfolioId - Portfolio ID
   * @param {Number} schemeCode - Scheme code
   * @param {Number} units - Units bought
   * @param {Number} nav - NAV at purchase
   */
  static async updateHoldingAfterBuy(portfolioId, schemeCode, units, nav) {
    const existingHolding = await Holding.findOne({ portfolioId, schemeCode });
    
    if (existingHolding) {
      // Calculate new weighted average NAV
      const totalInvestedValue = existingHolding.investedValue + (units * nav);
      const totalUnits = existingHolding.totalUnits + units;
      const newAvgNav = totalInvestedValue / totalUnits;

      await Holding.updateOne(
        { portfolioId, schemeCode },
        {
          totalUnits,
          avgNav: newAvgNav,
          investedValue: totalInvestedValue,
          updatedAt: new Date()
        }
      );
    } else {
      // Create new holding
      const holding = new Holding({
        portfolioId,
        schemeCode,
        totalUnits: units,
        avgNav: nav,
        investedValue: units * nav
      });
      await holding.save();
    }
  }

  /**
   * Update holding after sell transaction
   * @param {ObjectId} portfolioId - Portfolio ID
   * @param {Number} schemeCode - Scheme code
   * @param {Number} unitsSold - Units sold
   */
  static async updateHoldingAfterSell(portfolioId, schemeCode, unitsSold) {
    const holding = await Holding.findOne({ portfolioId, schemeCode });
    
    if (!holding) {
      throw new Error('Holding not found');
    }

    const remainingUnits = holding.totalUnits - unitsSold;
    
    if (remainingUnits <= 0) {
      // Delete holding if no units left
      await Holding.deleteOne({ portfolioId, schemeCode });
    } else {
      // Update holding - avgNav remains same, only units and invested value change
      const newInvestedValue = remainingUnits * holding.avgNav;
      
      await Holding.updateOne(
        { portfolioId, schemeCode },
        {
          totalUnits: remainingUnits,
          investedValue: newInvestedValue,
          updatedAt: new Date()
        }
      );
    }
  }

  /**
   * Calculate realized P&L using FIFO method
   * @param {ObjectId} portfolioId - Portfolio ID
   * @param {Number} unitsToSell - Units to sell
   * @param {Number} currentNav - Current NAV
   * @returns {Number} Realized P&L
   */
  static async calculateFifoRealizedPL(portfolioId, unitsToSell, currentNav) {
    // Get all BUY transactions for this portfolio, ordered by date (FIFO)
    const buyTransactions = await Transaction.find({
      portfolioId,
      type: 'BUY'
    }).sort({ date: 1 });

    // Get all SELL transactions to calculate remaining units in each lot
    const sellTransactions = await Transaction.find({
      portfolioId,
      type: 'SELL'
    }).sort({ date: 1 });

    // Calculate remaining units in each buy lot after previous sells
    const lots = [];
    let totalSellUnits = sellTransactions.reduce((sum, sell) => sum + sell.units, 0);
    let remainingSellUnits = totalSellUnits;

    for (const buy of buyTransactions) {
      let lotUnits = buy.units;
      
      if (remainingSellUnits > 0) {
        if (remainingSellUnits >= lotUnits) {
          remainingSellUnits -= lotUnits;
          lotUnits = 0; // This lot is completely sold
        } else {
          lotUnits -= remainingSellUnits;
          remainingSellUnits = 0;
        }
      }
      
      if (lotUnits > 0) {
        lots.push({
          units: lotUnits,
          nav: buy.nav,
          date: buy.date
        });
      }
    }

    // Calculate P&L for the units being sold using FIFO
    let realizedPL = 0;
    let remainingToSell = unitsToSell;

    for (const lot of lots) {
      if (remainingToSell <= 0) break;
      
      const unitsFromThisLot = Math.min(remainingToSell, lot.units);
      realizedPL += (currentNav - lot.nav) * unitsFromThisLot;
      remainingToSell -= unitsFromThisLot;
    }

    return realizedPL;
  }

  /**
   * Get user's complete portfolio with holdings
   * @param {ObjectId} userId - User ID
   * @returns {Array} Array of portfolios with holdings
   */
  static async getUserPortfolio(userId) {
    const portfolios = await Portfolio.find({ userId });
    const result = [];

    for (const portfolio of portfolios) {
      const holding = await Holding.findOne({ portfolioId: portfolio._id, schemeCode: portfolio.schemeCode });
      const fund = await Fund.findOne({ schemeCode: portfolio.schemeCode });
      
      result.push({
        portfolio,
        holding,
        fund
      });
    }

    return result;
  }

  /**
   * Calculate current portfolio value with P&L
   * @param {ObjectId} userId - User ID
   * @returns {Object} Portfolio valuation
   */
  static async calculatePortfolioValue(userId) {
    const portfolios = await Portfolio.find({ userId });
    let totalInvestment = 0;
    let currentValue = 0;
    const holdings = [];

    for (const portfolio of portfolios) {
      const holding = await Holding.findOne({ 
        portfolioId: portfolio._id, 
        schemeCode: portfolio.schemeCode 
      });
      
      if (holding && holding.totalUnits > 0) {
        const navData = await NavService.getLatestNav(portfolio.schemeCode);
        const currentNav = navData.success ? navData.data.nav : holding.avgNav;
        
        totalInvestment += holding.investedValue;
        currentValue += holding.totalUnits * currentNav;
        
        holdings.push({
          schemeCode: portfolio.schemeCode,
          totalUnits: holding.totalUnits,
          avgNav: holding.avgNav,
          currentNav,
          investedValue: holding.investedValue,
          currentValue: holding.totalUnits * currentNav,
          profitLoss: (holding.totalUnits * currentNav) - holding.investedValue
        });
      }
    }

    const totalProfitLoss = currentValue - totalInvestment;
    const profitLossPercent = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      currentValue,
      totalProfitLoss,
      profitLossPercent,
      holdings
    };
  }

  /**
   * Get transaction history for a portfolio
   * @param {ObjectId} userId - User ID
   * @param {Number} schemeCode - Optional scheme code filter
   * @param {Object} options - Pagination options
   * @returns {Array} Transaction history
   */
  static async getTransactionHistory(userId, schemeCode = null, options = {}) {
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
  }

  /**
   * Rebuild holdings from transactions (data consistency helper)
   * @param {ObjectId} userId - User ID
   * @param {Number} schemeCode - Optional scheme code
   */
  static async rebuildHoldings(userId, schemeCode = null) {
    let portfolios;
    
    if (schemeCode) {
      portfolios = await Portfolio.find({ userId, schemeCode });
    } else {
      portfolios = await Portfolio.find({ userId });
    }

    for (const portfolio of portfolios) {
      // Delete existing holding
      await Holding.deleteOne({ portfolioId: portfolio._id, schemeCode: portfolio.schemeCode });

      // Get all transactions for this portfolio
      const transactions = await Transaction.find({ portfolioId: portfolio._id }).sort({ date: 1 });

      let totalUnits = 0;
      let totalInvestedValue = 0;

      for (const transaction of transactions) {
        if (transaction.type === 'BUY') {
          totalUnits += transaction.units;
          totalInvestedValue += transaction.amount;
        } else if (transaction.type === 'SELL') {
          totalUnits -= transaction.units;
          // For sells, we need to calculate the cost basis of sold units
          // This is simplified - in practice, you'd use FIFO to determine exact cost
          const avgNav = totalInvestedValue / (totalUnits + transaction.units);
          totalInvestedValue -= transaction.units * avgNav;
        }
      }

      // Create new holding if there are units
      if (totalUnits > 0) {
        const avgNav = totalInvestedValue / totalUnits;
        
        const holding = new Holding({
          portfolioId: portfolio._id,
          schemeCode: portfolio.schemeCode,
          totalUnits,
          avgNav,
          investedValue: totalInvestedValue
        });
        
        await holding.save();
      }
    }
  }
}

export default PortfolioService;
