import FormatUtils from '../../utils/format-utils.js';

class FundResponse {
  // Format successful funds list response
  static formatFundsListResponse(fundsData) {
    const { funds, pagination } = fundsData;
    
    return {
      success: true,
      data: {
        funds: funds.map(fund => this.formatFundSummary(fund)),
        pagination: {
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          totalFunds: pagination.totalFunds,
          limit: pagination.limit,
          hasNext: pagination.hasNext,
          hasPrev: pagination.hasPrev
        }
      }
    };
  }

  // Format single fund response
  static formatSingleFundResponse(fund) {
    return {
      success: true,
      data: {
        fund: this.formatFundDetails(fund)
      }
    };
  }

  // Format fund search response
  static formatSearchResultsResponse(searchData) {
    const { funds, pagination } = searchData;
    
    return {
      success: true,
      data: {
        results: funds.map(fund => this.formatFundSummary(fund)),
        pagination: {
          currentPage: pagination.currentPage,
          totalPages: pagination.totalPages,
          totalResults: pagination.totalFunds,
          limit: pagination.limit,
          hasNext: pagination.hasNext,
          hasPrev: pagination.hasPrev
        }
      }
    };
  }

  // Format fund statistics response
  static formatStatsResponse(stats) {
    return {
      success: true,
      data: {
        statistics: {
          totalFunds: stats.totalFunds,
          totalCategories: stats.totalCategories,
          totalFundHouses: stats.totalFundHouses
        },
        categories: stats.categories,
        fundHouses: stats.fundHouses
      }
    };
  }

  // Format fund summary (for lists)
  static formatFundSummary(fund) {
    return {
      schemeCode: fund.schemeCode,
      schemeName: FormatUtils.formatSchemeName(fund.schemeName),
      fundHouse: fund.fundHouse,
      schemeCategory: fund.schemeCategory,
      schemeType: fund.schemeType
    };
  }

  // Format fund details (for single fund view)
  static formatFundDetails(fund) {
    return {
      schemeCode: fund.schemeCode,
      schemeName: fund.schemeName,
      fundHouse: fund.fundHouse,
      schemeCategory: fund.schemeCategory,
      schemeType: fund.schemeType,
      isinGrowth: fund.isinGrowth || null,
      isinDivReinvestment: fund.isinDivReinvestment || null,
      createdAt: fund.createdAt,
      updatedAt: fund.updatedAt
    };
  }

  // Format fund NAV response
  static formatNavResponse(navData) {
    return {
      success: true,
      data: navData
    };
  }

  // Format fund categories response
  static formatCategoriesResponse(categories) {
    return {
      success: true,
      data: {
        categories: categories.map(category => ({
          name: category,
          displayName: FormatUtils.titleCase(category)
        }))
      }
    };
  }

  // Format fund houses response
  static formatFundHousesResponse(fundHouses) {
    return {
      success: true,
      data: {
        fundHouses: fundHouses.map(fundHouse => ({
          name: fundHouse,
          displayName: fundHouse
        }))
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

  // Format empty results response
  static formatEmptyResultsResponse(message = 'No funds found') {
    return {
      success: true,
      data: {
        funds: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalFunds: 0,
          limit: 20,
          hasNext: false,
          hasPrev: false
        }
      },
      message
    };
  }
}

export default FundResponse;