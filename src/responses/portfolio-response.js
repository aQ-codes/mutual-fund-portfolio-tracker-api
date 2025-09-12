import FormatUtils from '../utils/format-utils.js';
import DateUtils from '../utils/date-utils.js';

class PortfolioResponse {
  // Format response for adding fund to portfolio
  static formatAddFundResponse(data) {
    const { schemeCode, schemeName, units, nav, amount, date } = data;
    
    return {
      id: null, // Will be set by MongoDB
      schemeCode,
      schemeName,
      units: parseFloat(units.toFixed(3)),
      nav: parseFloat(nav.toFixed(4)),
      amount: parseFloat(amount.toFixed(2)),
      addedAt: DateUtils.formatToISO(date)
    };
  }

  // Format response for portfolio value
  static formatPortfolioValueResponse(data) {
    const { totalInvestment, currentValue, profitLoss, profitLossPercent, asOn, holdings } = data;
    
    return {
      totalInvestment: parseFloat(totalInvestment.toFixed(2)),
      currentValue: parseFloat(currentValue.toFixed(2)),
      profitLoss: parseFloat(profitLoss.toFixed(2)),
      profitLossPercent: parseFloat(profitLossPercent.toFixed(2)),
      asOn,
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
    };
  }

  // Format response for empty portfolio value
  static formatEmptyPortfolioValue() {
    return {
      totalInvestment: 0,
      currentValue: 0,
      profitLoss: 0,
      profitLossPercent: 0,
      asOn: DateUtils.formatToIndianDate(new Date()),
      holdings: []
    };
  }

  // Format response for portfolio list
  static formatPortfolioListResponse(data) {
    const { totalHoldings, holdings } = data;
    
    return {
      totalHoldings,
      holdings: holdings.map(holding => ({
        schemeCode: holding.schemeCode,
        schemeName: holding.schemeName,
        units: parseFloat(holding.units.toFixed(3)),
        currentNav: parseFloat(holding.currentNav.toFixed(4)),
        currentValue: parseFloat(holding.currentValue.toFixed(2))
      }))
    };
  }

  // Format response for empty portfolio list
  static formatEmptyPortfolioList() {
    return {
      totalHoldings: 0,
      holdings: []
    };
  }

  // Format response for portfolio history
  static formatPortfolioHistoryResponse(data) {
    return data.map(entry => ({
      date: entry.date,
      totalValue: parseFloat(entry.totalValue.toFixed(2)),
      profitLoss: parseFloat(entry.profitLoss.toFixed(2))
    }));
  }

  // Format response for transaction history (for future use)
  static formatTransactionResponse(transaction) {
    return {
      id: transaction._id,
      type: transaction.type,
      schemeCode: transaction.schemeCode,
      units: parseFloat(transaction.units.toFixed(3)),
      pricePerUnit: parseFloat(transaction.pricePerUnit.toFixed(4)),
      amount: parseFloat(transaction.amount.toFixed(2)),
      date: DateUtils.formatToISO(transaction.date),
      navUsed: parseFloat(transaction.navUsed.toFixed(4)),
      realizedPL: transaction.realizedPL ? parseFloat(transaction.realizedPL.toFixed(2)) : 0,
      status: transaction.status
    };
  }

  // Format response for bulk transactions
  static formatTransactionListResponse(transactions, pagination = null) {
    const response = {
      transactions: transactions.map(transaction => this.formatTransactionResponse(transaction))
    };

    if (pagination) {
      response.pagination = {
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        totalTransactions: pagination.totalTransactions,
        hasNext: pagination.hasNext,
        hasPrev: pagination.hasPrev
      };
    }

    return response;
  }

  // Format response for portfolio summary
  static formatPortfolioSummaryResponse(data) {
    const { 
      totalInvestment, 
      currentValue, 
      profitLoss, 
      profitLossPercent, 
      totalHoldings, 
      asOn,
      topPerformers,
      recentTransactions 
    } = data;
    
    return {
      summary: {
        totalInvestment: parseFloat(totalInvestment.toFixed(2)),
        currentValue: parseFloat(currentValue.toFixed(2)),
        profitLoss: parseFloat(profitLoss.toFixed(2)),
        profitLossPercent: parseFloat(profitLossPercent.toFixed(2)),
        totalHoldings,
        asOn
      },
      topPerformers: topPerformers?.map(performer => ({
        schemeCode: performer.schemeCode,
        schemeName: performer.schemeName,
        profitLossPercent: parseFloat(performer.profitLossPercent.toFixed(2)),
        currentValue: parseFloat(performer.currentValue.toFixed(2))
      })) || [],
      recentTransactions: recentTransactions?.map(transaction => 
        this.formatTransactionResponse(transaction)
      ) || []
    };
  }

  // Format error response for portfolio operations
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

  // Format success response for portfolio operations
  static formatSuccessResponse(message, data = null) {
    const response = {
      success: true,
      message
    };

    if (data) {
      response.data = data;
    }

    return response;
  }
}

export default PortfolioResponse;
