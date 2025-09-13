import FundRepository from '../../repositories/fund-repository.js';
import FundRequest from '../../requests/user/fund-request.js';
import FundResponse from '../../responses/user/fund-response.js';
import NavService from '../../services/nav-service.js';
import { CustomValidationError } from '../../exceptions/custom-validation-error.js';

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
      const { schemeCode } = req.params;
      
      // Validate scheme code
      const validationResult = FundRequest.validateSchemeCode(schemeCode);
      if (!validationResult.isValid) {
        throw new CustomValidationError('Invalid scheme code', validationResult.errors);
      }
      
      // Fetch fund from repository
      const result = await FundRepository.getFundBySchemeCode(schemeCode);
      
      if (!result.status) {
        return res.status(500).json(
          FundResponse.formatErrorResponse('Failed to fetch fund details', result.message)
        );
      }
      
      if (!result.data) {
        return res.status(404).json(
          FundResponse.formatErrorResponse('Fund not found', 'No fund exists with the provided scheme code')
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
          FundResponse.formatValidationErrorResponse('Invalid request parameters', error.errors)
        );
      }
      
      res.status(500).json(
        FundResponse.formatErrorResponse('Failed to fetch fund details. Please try again.')
      );
    }
  }

  // GET /api/funds/search - Search funds by name or scheme code
  async searchFunds(req, res) {
    try {
      // Validate search query
      const validatedQuery = FundRequest.validateSearchQuery(req.query);
      
      // Perform search
      const result = await FundRepository.searchFunds(validatedQuery);
      
      if (!result.status) {
        return res.status(500).json(
          FundResponse.formatErrorResponse('Search failed', result.message)
        );
      }
      
      // Check if no results found
      if (result.data.funds.length === 0) {
        return res.status(200).json(
          FundResponse.formatEmptyResultsResponse('No funds found matching your search criteria')
        );
      }
      
      // Return successful response
      res.status(200).json(
        FundResponse.formatSearchResultsResponse(result.data)
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
      const result = await FundRepository.getFundCategories();
      
      if (!result.status) {
        return res.status(500).json(
          FundResponse.formatErrorResponse('Failed to fetch fund categories', result.message)
        );
      }
      
      res.status(200).json(
        FundResponse.formatCategoriesResponse(result.data)
      );
      
    } catch (error) {
      console.error('Get fund categories error:', error);
      
      res.status(500).json(
        FundResponse.formatErrorResponse('Failed to fetch fund categories. Please try again.')
      );
    }
  }

  // GET /api/funds/fund-houses - Get all fund houses
  async getFundHouses(req, res) {
    try {
      const result = await FundRepository.getFundHouses();
      
      if (!result.status) {
        return res.status(500).json(
          FundResponse.formatErrorResponse('Failed to fetch fund houses', result.message)
        );
      }
      
      res.status(200).json(
        FundResponse.formatFundHousesResponse(result.data)
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
          FundResponse.formatErrorResponse('Failed to fetch fund statistics', result.message)
        );
      }
      
      res.status(200).json(
        FundResponse.formatStatsResponse(result.data)
      );
      
    } catch (error) {
      console.error('Get fund stats error:', error);
      
      res.status(500).json(
        FundResponse.formatErrorResponse('Failed to fetch fund statistics. Please try again.')
      );
    }
  }

  // GET /api/funds/:schemeCode/nav - Get fund NAV and history
  async getFundNav(req, res) {
    try {
      const { schemeCode } = req.params;
      const { days = 30 } = req.query;
      
      // Validate scheme code (convert to number first)
      const validatedSchemeCode = FundRequest.validateSchemeCode(parseInt(schemeCode));
      
      // Get NAV data
      const result = await NavService.getFundNavWithHistory(validatedSchemeCode, parseInt(days));
      
      if (!result.status) {
        return res.status(500).json(
          FundResponse.formatErrorResponse('Failed to fetch NAV data', result.message)
        );
      }
      
      if (!result.data) {
        return res.status(404).json(
          FundResponse.formatErrorResponse('NAV data not found', 'No NAV data available for this fund')
        );
      }
      
      res.status(200).json(
        FundResponse.formatNavResponse(result.data)
      );
      
    } catch (error) {
      console.error('Get fund NAV error:', error);
      
      if (error instanceof CustomValidationError) {
        return res.status(400).json(
          FundResponse.formatValidationErrorResponse('Invalid request parameters', error.errors)
        );
      }
      
      res.status(500).json(
        FundResponse.formatErrorResponse('Failed to fetch NAV data. Please try again.')
      );
    }
  }
}

// Create and export an instance of the controller
const fundController = new FundController();
export default fundController;
