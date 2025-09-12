import FormatUtils from '../../utils/format-utils.js';
import DateUtils from '../../utils/date-utils.js';

class PortfolioResponse {
  // Format response for adding fund to portfolio
  static formatAddFundResponse(data) {
    const { schemeCode, schemeName, units, nav, investmentAmount, date } = data;
    
    return {
      success: true,
      message: 'Fund added to portfolio successfully',
      data: {
        schemeCode,
        schemeName,
        units: parseFloat(units.toFixed(3)),
        nav: parseFloat(nav.toFixed(4)),
        investmentAmount: parseFloat(investmentAmount.toFixed(2)),
        addedAt: DateUtils.formatToISO(date)
      }
    };
  }

  // Format response for portfolio value
  static formatPortfolioValueResponse(data) {
    const { totalInvestment, currentValue, profitLoss, profitLossPercent, asOn, holdings } = data;
    
    return {
      success: true,
      data: {
        summary: {
          totalInvestment: parseFloat(totalInvestment.toFixed(2)),
          currentValue: parseFloat(currentValue.toFixed(2)),
          profitLoss: parseFloat(profitLoss.toFixed(2)),
          profitLossPercent: parseFloat(profitLossPercent.toFixed(2)),
          asOn
        },
        holdings: holdings.map(holding => ({
          schemeCode: holding.schemeCode,
          schemeName: holding.schemeName,
          units: parseFloat(holding.units.toFixed(3)),
          currentNav: parseFloat(holding.currentNav.toFixed(4)),
          currentValue: parseFloat(holding.currentValue.toFixed(2)),
          investedValue: parseFloat(holding.investedValue.toFixed(2)),
          avgCost: parseFloat(holding.avgCost.toFixed(4)),
          profitLoss: parseFloat(holding.profitLoss.toFixed(2))
        }))
      }
    };
  }

  // Format response for portfolio list
  static formatPortfolioListResponse(data) {
    const { totalHoldings, holdings } = data;
    
    return {
      success: true,
      data: {
        totalHoldings,
        holdings: holdings.map(holding => ({
          schemeCode: holding.schemeCode,
          schemeName: holding.schemeName,
          units: parseFloat(holding.units.toFixed(3)),
          currentNav: parseFloat(holding.currentNav.toFixed(4)),
          currentValue: parseFloat(holding.currentValue.toFixed(2))
        }))
      }
    };
  }

  // Format response for portfolio history
  static formatPortfolioHistoryResponse(data) {
    return {
      success: true,
      data: {
        history: data.map(entry => ({
          date: entry.date,
          totalValue: parseFloat(entry.totalValue.toFixed(2)),
          profitLoss: parseFloat(entry.profitLoss.toFixed(2))
        }))
      }
    };
  }

  // Format response for removing fund
  static formatRemoveFundResponse(data) {
    return {
      success: true,
      message: 'Fund removed from portfolio successfully',
      data
    };
  }

  // Format empty portfolio response
  static formatEmptyPortfolioResponse(message) {
    return {
      success: true,
      message,
      data: {
        summary: {
          totalInvestment: 0,
          currentValue: 0,
          profitLoss: 0,
          profitLossPercent: 0,
          asOn: DateUtils.formatToIndianDate(new Date())
        },
        holdings: []
      }
    };
  }

  // Format error response
  static formatErrorResponse(message, errors = null) {
    const response = {
      success: false,
      message
    };

    if (errors) {
      response.errors = errors;
    }

    return response;
  }

  // Format validation error response
  static formatValidationErrorResponse(message, validationErrors) {
    return {
      success: false,
      message,
      errors: validationErrors.map(error => ({
        field: error.field,
        message: error.message
      }))
    };
  }
}

export default PortfolioResponse;