// Portfolio-specific business logic helpers
import MathUtils from '../utils/math-utils.js';
import FormatUtils from '../utils/format-utils.js';
import FifoUtils from '../utils/fifo-utils.js';

class PortfolioHelpers {
  // Calculate average cost for a holding (delegated to FifoUtils)
  static calculateAverageCost(lots) {
    return FifoUtils.calculateWeightedAverageCost(lots);
  }

  // FIFO sell calculation (delegated to FifoUtils)
  static calculateFifoSell(lots, unitsToSell, currentNav) {
    return FifoUtils.calculateFifoSell(lots, unitsToSell, currentNav);
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

  // Format currency values (delegated to FormatUtils)
  static formatCurrency(amount, currency = '₹') {
    return FormatUtils.formatCurrency(amount, currency);
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
}

export default PortfolioHelpers;
