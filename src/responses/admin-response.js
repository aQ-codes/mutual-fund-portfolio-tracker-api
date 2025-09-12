import FormatUtils from '../utils/format-utils.js';
import DateUtils from '../utils/date-utils.js';

class AdminResponse {
  // Format response for users list
  static formatUsersResponse(users, pagination) {
    return {
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: DateUtils.formatToISO(user.createdAt),
        updatedAt: DateUtils.formatToISO(user.updatedAt)
      })),
      pagination: {
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        totalUsers: pagination.totalUsers,
        hasNext: pagination.hasNext,
        hasPrev: pagination.hasPrev
      }
    };
  }

  // Format response for portfolios list
  static formatPortfoliosResponse(portfolios, pagination) {
    return {
      portfolios: portfolios.map(portfolio => ({
        id: portfolio._id,
        user: {
          id: portfolio.userId._id,
          name: portfolio.userId.name,
          email: portfolio.userId.email
        },
        totalHoldings: portfolio.holdings.length,
        totalTransactions: portfolio.transactions.length,
        holdings: portfolio.holdings.map(holding => ({
          schemeCode: holding.schemeCode,
          totalUnits: parseFloat(holding.totalUnits.toFixed(3)),
          lotsCount: holding.lots.length
        })),
        createdAt: DateUtils.formatToISO(portfolio.createdAt),
        updatedAt: DateUtils.formatToISO(portfolio.updatedAt)
      })),
      pagination: {
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        totalPortfolios: pagination.totalPortfolios,
        hasNext: pagination.hasNext,
        hasPrev: pagination.hasPrev
      }
    };
  }

  // Format response for popular funds
  static formatPopularFundsResponse(popularFunds, fundDetails, latestNavs) {
    return {
      popularFunds: popularFunds.map(fund => {
        const fundDetail = fundDetails.find(f => f.schemeCode === fund._id);
        const latestNav = latestNavs.find(nav => nav.schemeCode === fund._id);
        
        return {
          schemeCode: fund._id,
          schemeName: fundDetail?.schemeName || `Fund ${fund._id}`,
          fundHouse: fundDetail?.fundHouse || 'Unknown',
          totalInvestors: fund.totalInvestors,
          totalUnits: parseFloat(fund.totalUnits.toFixed(3)),
          avgUnitsPerInvestor: parseFloat(fund.avgUnitsPerInvestor.toFixed(3)),
          currentNav: latestNav ? parseFloat(latestNav.nav.toFixed(4)) : null,
          lastNavUpdate: latestNav ? latestNav.date : null
        };
      })
    };
  }

  // Format response for system statistics
  static formatSystemStatsResponse(stats) {
    return {
      overview: {
        totalUsers: stats.totalUsers,
        totalPortfolios: stats.totalPortfolios,
        totalTransactions: stats.totalTransactions,
        totalFunds: stats.totalFunds,
        activeUsers: stats.activeUsers,
        totalInvestmentValue: parseFloat(stats.totalInvestmentValue.toFixed(2))
      },
      userGrowth: stats.userGrowth,
      portfolioDistribution: stats.portfolioDistribution,
      recentTransactions: stats.recentTransactions.map(transaction => ({
        id: transaction._id,
        user: {
          id: transaction.userId._id,
          name: transaction.userId.name,
          email: transaction.userId.email
        },
        type: transaction.type,
        schemeCode: transaction.schemeCode,
        units: parseFloat(transaction.units.toFixed(3)),
        amount: parseFloat(transaction.amount.toFixed(2)),
        date: DateUtils.formatToISO(transaction.date)
      })),
      generatedAt: new Date().toISOString()
    };
  }

  // Format response for cron job status
  static formatCronStatusResponse(jobs) {
    return {
      jobs: Object.keys(jobs).map(jobName => ({
        name: jobName,
        running: jobs[jobName].running,
        scheduled: jobs[jobName].scheduled,
        status: jobs[jobName].running ? 'active' : 'inactive'
      })),
      lastChecked: new Date().toISOString()
    };
  }

  // Format response for user management operations
  static formatUserManagementResponse(user, action, success = true) {
    return {
      success,
      action,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        updatedAt: DateUtils.formatToISO(user.updatedAt)
      },
      timestamp: new Date().toISOString()
    };
  }

  // Format response for portfolio analytics
  static formatPortfolioAnalyticsResponse(analytics) {
    return {
      totalPortfolios: analytics.totalPortfolios,
      averagePortfolioValue: parseFloat(analytics.averagePortfolioValue.toFixed(2)),
      portfolioValueDistribution: analytics.portfolioValueDistribution,
      topPerformingFunds: analytics.topPerformingFunds.map(fund => ({
        schemeCode: fund.schemeCode,
        schemeName: fund.schemeName,
        totalInvestors: fund.totalInvestors,
        averageReturn: parseFloat(fund.averageReturn.toFixed(2))
      })),
      generatedAt: new Date().toISOString()
    };
  }

  // Format response for transaction analytics
  static formatTransactionAnalyticsResponse(analytics) {
    return {
      totalTransactions: analytics.totalTransactions,
      totalVolume: parseFloat(analytics.totalVolume.toFixed(2)),
      buyVsSellRatio: {
        buyTransactions: analytics.buyTransactions,
        sellTransactions: analytics.sellTransactions,
        ratio: parseFloat((analytics.buyTransactions / (analytics.sellTransactions || 1)).toFixed(2))
      },
      monthlyTrends: analytics.monthlyTrends.map(trend => ({
        month: trend.month,
        transactions: trend.transactions,
        volume: parseFloat(trend.volume.toFixed(2))
      })),
      generatedAt: new Date().toISOString()
    };
  }

  // Format error response for admin operations
  static formatErrorResponse(message, errors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };

    if (errors) {
      response.errors = errors;
    }

    return response;
  }

  // Format success response for admin operations
  static formatSuccessResponse(message, data = null) {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString()
    };

    if (data) {
      response.data = data;
    }

    return response;
  }

  // Format response for system health check
  static formatSystemHealthResponse(health) {
    return {
      status: health.overall,
      components: {
        database: {
          status: health.database.status,
          responseTime: health.database.responseTime,
          lastChecked: health.database.lastChecked
        },
        externalApi: {
          status: health.externalApi.status,
          responseTime: health.externalApi.responseTime,
          lastChecked: health.externalApi.lastChecked
        },
        cronJobs: {
          status: health.cronJobs.status,
          activeJobs: health.cronJobs.activeJobs,
          lastChecked: health.cronJobs.lastChecked
        }
      },
      uptime: health.uptime,
      timestamp: new Date().toISOString()
    };
  }
}

export default AdminResponse;
