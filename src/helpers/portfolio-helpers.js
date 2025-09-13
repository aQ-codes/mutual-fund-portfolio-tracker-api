// Portfolio-specific business logic helpers
import MathUtils from '../utils/math-utils.js';
import FormatUtils from '../utils/format-utils.js';
import CurrencyUtils from '../utils/currency-utils.js';
import FifoHelpers from './fifo-helpers.js';

class PortfolioHelpers {
  // Calculate average cost for a holding (delegated to FifoHelpers)
  static calculateAverageCost(lots) {
    return FifoHelpers.calculateWeightedAverageCost(lots);
  }

  // FIFO sell calculation (delegated to FifoHelpers)
  static calculateFifoSell(lots, unitsToSell, currentNav) {
    return FifoHelpers.calculateFifoSell(lots, unitsToSell, currentNav);
  }

  // Calculate current portfolio value
  static calculatePortfolioValue(holdings, latestNavs) {
    if (!holdings || holdings.length === 0) {
      return {
        totalInvestment: 0,
        currentValue: 0,
        profitLoss: 0,
        profitLossPercent: 0
      };
    }

    let totalInvestment = 0;
    let currentValue = 0;

    holdings.forEach(holding => {
      const investedValue = holding.lots.reduce((sum, lot) => sum + (lot.units * lot.pricePerUnit), 0);
      totalInvestment += investedValue;

      const latestNav = latestNavs.find(nav => nav.schemeCode === holding.schemeCode);
      if (latestNav) {
        currentValue += holding.totalUnits * latestNav.nav;
      }
    });

    const profitLoss = currentValue - totalInvestment;
    const profitLossPercent = MathUtils.percentageChange(totalInvestment, currentValue);

    return {
      totalInvestment,
      currentValue,
      profitLoss,
      profitLossPercent
    };
  }

  // Calculate portfolio performance over time
  static calculatePortfolioHistory(holdings, navHistory, days = 30) {
    // This would calculate portfolio value for each day based on NAV history
    // Implementation depends on how NAV history is structured
    const history = [];
    
    // Placeholder implementation - would need actual NAV history data
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Calculate portfolio value for this date using historical NAVs
      // This is a simplified version - real implementation would use actual NAV data
      history.push({
        date: date.toISOString().split('T')[0],
        totalValue: 0, // Calculate based on NAV history
        profitLoss: 0
      });
    }
    
    return history.reverse(); // Return oldest first
  }

  // Validate portfolio transaction
  static validateTransaction(type, units, schemeCode, currentHolding = null) {
    const errors = [];

    if (!['BUY', 'SELL'].includes(type)) {
      errors.push('Transaction type must be BUY or SELL');
    }

    if (!units || units <= 0) {
      errors.push('Units must be greater than 0');
    }

    if (!schemeCode || schemeCode < 100000 || schemeCode > 999999) {
      errors.push('Invalid scheme code');
    }

    if (type === 'SELL') {
      if (!currentHolding || currentHolding.totalUnits < units) {
        errors.push('Insufficient units to sell');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Format currency values (delegated to CurrencyUtils)
  static formatCurrency(amount, currency = '₹') {
    return CurrencyUtils.formatCurrency(amount, currency);
  }

  // Calculate units from amount and NAV
  static calculateUnitsFromAmount(amount, nav) {
    if (!amount || !nav || nav <= 0) {
      return 0;
    }
    
    return parseFloat((amount / nav).toFixed(3)); // 3 decimal places for units
  }

  // Calculate amount from units and NAV
  static calculateAmountFromUnits(units, nav) {
    if (!units || !nav || units <= 0 || nav <= 0) {
      return 0;
    }
    
    return parseFloat((units * nav).toFixed(2)); // 2 decimal places for amount
  }

  // Get portfolio value history over time (cumulative of all funds)
  static async getPortfolioValueHistory(userId, options = {}) {
    try {
      const { days = 30, startDate, endDate } = options;
      
      // Import required modules
      const Portfolio = (await import('../models/portfolio.js')).default;
      const Holding = (await import('../models/holding.js')).default;
      const FundNavHistory = (await import('../models/fund-nav-history.js')).default;
      const DateUtils = (await import('../utils/date-utils.js')).default;
      
      // Get user's portfolios with holdings
      const portfolios = await Portfolio.find({ userId });
      
      if (!portfolios || portfolios.length === 0) {
        return {
          status: true,
          data: []
        };
      }
      
      // Get all holdings for the user's portfolios
      const portfolioIds = portfolios.map(p => p._id);
      const holdings = await Holding.find({ portfolioId: { $in: portfolioIds } });
      
      if (!holdings || holdings.length === 0) {
        return {
          status: true,
          data: []
        };
      }
      
      // Get unique scheme codes from holdings
      const schemeCodes = [...new Set(holdings.map(h => h.schemeCode))];
      
      // Get historical NAV data for all funds
      const navHistoryData = await FundNavHistory.find({ 
        schemeCode: { $in: schemeCodes } 
      });
      
      // Create a map of scheme code to NAV history for quick lookup
      const navHistoryMap = {};
      navHistoryData.forEach(fund => {
        if (fund.history && fund.history.length > 0) {
          // Sort history by date (newest first) for efficient lookup
          fund.history.sort((a, b) => new Date(b.date) - new Date(a.date));
          navHistoryMap[fund.schemeCode] = fund.history;
        }
      });
      
      // Generate date range
      let dateRange = [];
      if (startDate && endDate) {
        const start = DateUtils.parseApiDate(startDate);
        const end = DateUtils.parseApiDate(endDate);
        const current = new Date(start);
        
        while (current <= end) {
          dateRange.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
      } else {
        // Generate last N days
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          dateRange.push(date);
        }
      }
      
      const history = [];
      
      // For each date, calculate total portfolio value using historical NAVs
      for (const date of dateRange) {
        let totalInvestment = 0;
        let currentValue = 0;
        
        for (const holding of holdings) {
          // Only calculate for holdings that existed on or before this date
          const holdingStartDate = new Date(holding.createdAt);
          if (date < holdingStartDate) {
            continue; // Skip if holding didn't exist on this date
          }
          
          totalInvestment += holding.investedValue;
          
          // Get historical NAV for this date
          const navHistory = navHistoryMap[holding.schemeCode];
          let navForDate = null;
          
          if (navHistory) {
            // Find the NAV for this specific date or the closest previous date
            for (const navEntry of navHistory) {
              const navDate = new Date(navEntry.date);
              if (navDate <= date) {
                navForDate = navEntry.nav;
                break;
              }
            }
          }
          
          // If no historical NAV found, use average NAV as fallback
          if (navForDate === null) {
            navForDate = holding.avgNav;
          }
          
          currentValue += holding.totalUnits * navForDate;
        }
        
        const profitLoss = currentValue - totalInvestment;
        
        history.push({
          date: DateUtils.formatToApiDate(date),
          totalValue: parseFloat(currentValue.toFixed(2)),
          profitLoss: parseFloat(profitLoss.toFixed(2))
        });
      }
      
      return {
        status: true,
        data: history
      };
      
    } catch (error) {
      console.error('Error getting portfolio value history:', error);
      return {
        status: false,
        message: error.message
      };
    }
  }
}

export default PortfolioHelpers;
