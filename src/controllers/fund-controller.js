import FundRepository from '../repositories/fund-repository.js';
import FundRequest from '../requests/fund-request.js';
import FundResponse from '../responses/fund-response.js';
import NavService from '../services/nav-service.js';
import { CustomValidationError } from '../exceptions/custom-validation-error.js';

class FundController {
  // GET /api/funds - Get all funds with pagination and filters
  async getFunds(req, res) {
    try {
      // Validate query parameters
      const validatedQuery = FundRequest.validateFundQuery(req.query);
      
      // Fetch funds from repository
      const result = await FundRepository.getFunds(validatedQuery);
      
      if (!result.status) {
        return res.status(500).json(
          FundResponse.formatErrorResponse('Failed to fetch funds', result.message)
        );
      }
      
      // Check if no funds found
      if (result.data.funds.length === 0) {
        return res.status(200).json(
          FundResponse.formatEmptyResultsResponse('No funds found matching your criteria')
        );
      }
      
      // Return successful response
      res.status(200).json(
        FundResponse.formatFundsListResponse(result.data)
      );
      
    } catch (error) {
      console.error('Get funds error:', error);
      
      if (error instanceof CustomValidationError) {
        return res.status(400).json(
          FundResponse.formatValidationErrorResponse('Invalid query parameters', error.errors)
        );
      }
      
      res.status(500).json(
        FundResponse.formatErrorResponse('Failed to fetch funds. Please try again.')
      );
    }
  }

  // GET /api/funds/:schemeCode - Get single fund by scheme code
  async getFundBySchemeCode(req, res) {
    try {
      // Validate scheme code
      const schemeCode = FundRequest.validateSchemeCode(parseInt(req.params.schemeCode));
      
      // Fetch fund from repository
      const result = await FundRepository.getFundBySchemeCode(schemeCode);
      
      if (!result.status) {
        return res.status(404).json(
          FundResponse.formatNotFoundResponse('Fund')
        );
      }
      
      // Return successful response
      res.status(200).json(
        FundResponse.formatSingleFundResponse(result.data)
      );
      
    } catch (error) {
      console.error('Get fund by scheme code error:', error);
      
      if (error instanceof CustomValidationError) {
        return res.status(400).json(
          FundResponse.formatValidationErrorResponse('Invalid scheme code', error.errors)
        );
      }
      
      res.status(500).json(
        FundResponse.formatErrorResponse('Failed to fetch fund. Please try again.')
      );
    }
  }

  // GET /api/funds/search - Search funds
  async searchFunds(req, res) {
    try {
      // Validate search parameters
      const validatedQuery = FundRequest.validateFundSearch(req.query);
      
      // Search funds from repository
      const result = await FundRepository.searchFunds(validatedQuery.q, validatedQuery);
      
      if (!result.status) {
        return res.status(500).json(
          FundResponse.formatErrorResponse('Search failed', result.message)
        );
      }
      
      // Check if no results found
      if (result.data.funds.length === 0) {
        return res.status(200).json(
          FundResponse.formatEmptyResultsResponse(`No funds found for "${validatedQuery.q}"`)
        );
      }
      
      // Return successful response
      res.status(200).json(
        FundResponse.formatFundSearchResponse(result.data, validatedQuery.q)
      );
      
    } catch (error) {
      console.error('Search funds error:', error);
      
      if (error instanceof CustomValidationError) {
        return res.status(400).json(
          FundResponse.formatValidationErrorResponse('Invalid search parameters', error.errors)
        );
      }
      
      res.status(500).json(
        FundResponse.formatErrorResponse('Search failed. Please try again.')
      );
    }
  }

  // GET /api/funds/categories - Get all fund categories
  async getFundCategories(req, res) {
    try {
      const result = await FundRepository.getFundStats();
      
      if (!result.status) {
        return res.status(500).json(
          FundResponse.formatErrorResponse('Failed to fetch categories', result.message)
        );
      }
      
      res.status(200).json(
        FundResponse.formatCategoriesResponse(result.data.categories)
      );
      
    } catch (error) {
      console.error('Get fund categories error:', error);
      
      res.status(500).json(
        FundResponse.formatErrorResponse('Failed to fetch categories. Please try again.')
      );
    }
  }

  // GET /api/funds/fund-houses - Get all fund houses
  async getFundHouses(req, res) {
    try {
      const result = await FundRepository.getFundStats();
      
      if (!result.status) {
        return res.status(500).json(
          FundResponse.formatErrorResponse('Failed to fetch fund houses', result.message)
        );
      }
      
      res.status(200).json(
        FundResponse.formatFundHousesResponse(result.data.fundHouses)
      );
      
    } catch (error) {
      console.error('Get fund houses error:', error);
      
      res.status(500).json(
        FundResponse.formatErrorResponse('Failed to fetch fund houses. Please try again.')
      );
    }
  }

  // GET /api/funds/stats - Get fund statistics
  async getFundStats(req, res) {
    try {
      const result = await FundRepository.getFundStats();
      
      if (!result.status) {
        return res.status(500).json(
          FundResponse.formatErrorResponse('Failed to fetch statistics', result.message)
        );
      }
      
      res.status(200).json(
        FundResponse.formatFundStatsResponse(result.data)
      );
      
    } catch (error) {
      console.error('Get fund stats error:', error);
      
      res.status(500).json(
        FundResponse.formatErrorResponse('Failed to fetch statistics. Please try again.')
      );
    }
  }

  // GET /api/funds/:schemeCode/nav - Get fund NAV and history
  async getFundNav(req, res) {
    try {
      // Validate scheme code
      const schemeCode = FundRequest.validateSchemeCode(parseInt(req.params.schemeCode));
      
      // Validate query parameters for history
      const options = FundRequest.validateNavQuery(req.query);
      
      // Get fund with NAV
      const fundResult = await NavService.getFundWithNav(schemeCode);
      
      if (!fundResult.success) {
        return res.status(404).json(
          FundResponse.formatNotFoundResponse('Fund')
        );
      }
      
      // Get NAV history if requested
      let history = null;
      if (options.includeHistory) {
        const historyResult = await NavService.getNavHistory(schemeCode, {
          days: options.days,
          source: options.source
        });
        
        if (historyResult.success) {
          history = historyResult.data.history;
        }
      }
      
      // Return successful response
      res.status(200).json(
        FundResponse.formatFundNavResponse(fundResult.data, history)
      );
      
    } catch (error) {
      console.error('Get fund NAV error:', error);
      
      if (error instanceof CustomValidationError) {
        return res.status(400).json(
          FundResponse.formatValidationErrorResponse('Invalid parameters', error.errors)
        );
      }
      
      res.status(500).json(
        FundResponse.formatErrorResponse('Failed to fetch fund NAV. Please try again.')
      );
    }
  }
}

export default FundController;
