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
      const NavService = (await import('../services/nav-service.js')).default;
      const DateUtils = (await import('../utils/date-utils.js')).default;
      
      // Get user's portfolios
      const portfolios = await Portfolio.find({ userId });
      
      if (!portfolios || portfolios.length === 0) {
        return {
          status: true,
          data: []
        };
      }
      
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
      
      // For each date, calculate total portfolio value
      for (const date of dateRange) {
        let totalInvestment = 0;
        let currentValue = 0;
        
        for (const portfolio of portfolios) {
          const holding = await Holding.findOne({ 
            portfolioId: portfolio._id, 
            schemeCode: portfolio.schemeCode 
          });
          
          if (holding && holding.totalUnits > 0) {
            // For historical dates, we'd need historical NAV
            // For now, using current NAV as approximation
            const navData = await NavService.getLatestNav(portfolio.schemeCode);
            const nav = navData.success ? navData.data.nav : holding.avgNav;
            
            totalInvestment += holding.investedValue;
            currentValue += holding.totalUnits * nav;
          }
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
