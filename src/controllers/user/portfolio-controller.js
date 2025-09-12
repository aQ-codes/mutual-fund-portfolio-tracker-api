import Portfolio from '../../models/portfolio.js';
import Fund from '../../models/fund.js';
import NavService from '../../services/nav-service.js';
import PortfolioHelpers from '../../helpers/portfolio-helpers.js';
import PortfolioRequest from '../../requests/user/portfolio-request.js';
import PortfolioResponse from '../../responses/user/portfolio-response.js';
import CustomValidationError from '../../exceptions/custom-validation-error.js';

class PortfolioController {
  // POST /api/portfolio/add - Add mutual fund to user's portfolio
  static async addFund(req, res) {
    try {
      // Validate request
      const validationResult = PortfolioRequest.validateAddFund(req.body);
      if (!validationResult.isValid) {
        throw new CustomValidationError('Validation failed', validationResult.errors);
      }

      const { schemeCode, units } = validationResult.data;
      const userId = req.user.id;

      // Check if fund exists
      const fund = await Fund.findOne({ schemeCode });
      if (!fund) {
        return res.status(404).json({
          success: false,
          message: 'Fund not found with the provided scheme code'
        });
      }

      // Get latest NAV for the fund
      const navData = await NavService.getLatestNav(schemeCode);
      if (!navData || !navData.nav) {
        return res.status(400).json({
          success: false,
          message: 'Unable to fetch current NAV for this fund. Please try again later.'
        });
      }

      // Get or create user's portfolio
      const portfolio = await Portfolio.getOrCreatePortfolio(userId);

      // Add units to portfolio
      await portfolio.addUnits(schemeCode, units, navData.nav, new Date());

      // Format response
      const responseData = PortfolioResponse.formatAddFundResponse({
        schemeCode,
        schemeName: fund.schemeName,
        units,
        nav: navData.nav,
        investmentAmount: units * navData.nav,
        date: new Date()
      });

      res.status(201).json(responseData);

    } catch (error) {
      console.error('Add fund to portfolio error:', error);
      
      if (error instanceof CustomValidationError) {
        return res.status(400).json(
          PortfolioResponse.formatValidationErrorResponse('Invalid request data', error.errors)
        );
      }
      
      res.status(500).json(
        PortfolioResponse.formatErrorResponse('Failed to add fund to portfolio. Please try again.')
      );
    }
  }

  // GET /api/portfolio/value - Get current portfolio value with P&L calculation
  static async getPortfolioValue(req, res) {
    try {
      const userId = req.user.id;

      // Get user's portfolio
      const portfolio = await Portfolio.findOne({ userId }).populate('holdings.schemeCode');
      
      if (!portfolio || portfolio.holdings.length === 0) {
        return res.status(200).json(
          PortfolioResponse.formatEmptyPortfolioResponse('Your portfolio is empty')
        );
      }

      // Calculate current portfolio value
      const portfolioValue = await PortfolioHelpers.calculateCurrentPortfolioValue(portfolio);
      
      if (!portfolioValue.status) {
        return res.status(500).json(
          PortfolioResponse.formatErrorResponse('Failed to calculate portfolio value', portfolioValue.message)
        );
      }

      res.status(200).json(
        PortfolioResponse.formatPortfolioValueResponse(portfolioValue.data)
      );

    } catch (error) {
      console.error('Get portfolio value error:', error);
      
      res.status(500).json(
        PortfolioResponse.formatErrorResponse('Failed to fetch portfolio value. Please try again.')
      );
    }
  }

  // GET /api/portfolio/list - Get user's complete portfolio
  static async getPortfolioList(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, sortBy = 'investmentAmount', sortOrder = 'desc' } = req.query;

      // Validate query parameters
      const validatedQuery = PortfolioRequest.validateListQuery({
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder
      });

      if (!validatedQuery.isValid) {
        throw new CustomValidationError('Invalid query parameters', validatedQuery.errors);
      }

      // Get user's portfolio with pagination
      const portfolio = await Portfolio.getPortfolioWithPagination(userId, validatedQuery.data);
      
      if (!portfolio.status) {
        return res.status(500).json(
          PortfolioResponse.formatErrorResponse('Failed to fetch portfolio', portfolio.message)
        );
      }

      if (!portfolio.data || portfolio.data.holdings.length === 0) {
        return res.status(200).json(
          PortfolioResponse.formatEmptyPortfolioResponse('Your portfolio is empty')
        );
      }

      res.status(200).json(
        PortfolioResponse.formatPortfolioListResponse(portfolio.data)
      );

    } catch (error) {
      console.error('Get portfolio list error:', error);
      
      if (error instanceof CustomValidationError) {
        return res.status(400).json(
          PortfolioResponse.formatValidationErrorResponse('Invalid request parameters', error.errors)
        );
      }
      
      res.status(500).json(
        PortfolioResponse.formatErrorResponse('Failed to fetch portfolio. Please try again.')
      );
    }
  }

  // GET /api/portfolio/history - Get portfolio value history
  static async getPortfolioHistory(req, res) {
    try {
      const userId = req.user.id;
      const { days = 30, interval = 'daily' } = req.query;

      // Validate query parameters
      const validatedQuery = PortfolioRequest.validateHistoryQuery({
        days: parseInt(days),
        interval
      });

      if (!validatedQuery.isValid) {
        throw new CustomValidationError('Invalid query parameters', validatedQuery.errors);
      }

      // Get portfolio history
      const history = await PortfolioHelpers.getPortfolioValueHistory(userId, validatedQuery.data);
      
      if (!history.status) {
        return res.status(500).json(
          PortfolioResponse.formatErrorResponse('Failed to fetch portfolio history', history.message)
        );
      }

      res.status(200).json(
        PortfolioResponse.formatPortfolioHistoryResponse(history.data)
      );

    } catch (error) {
      console.error('Get portfolio history error:', error);
      
      if (error instanceof CustomValidationError) {
        return res.status(400).json(
          PortfolioResponse.formatValidationErrorResponse('Invalid request parameters', error.errors)
        );
      }
      
      res.status(500).json(
        PortfolioResponse.formatErrorResponse('Failed to fetch portfolio history. Please try again.')
      );
    }
  }

  // DELETE /api/portfolio/remove/:schemeCode - Remove fund from portfolio
  static async removeFund(req, res) {
    try {
      const { schemeCode } = req.params;
      const userId = req.user.id;

      // Validate scheme code
      const validationResult = PortfolioRequest.validateSchemeCode(schemeCode);
      if (!validationResult.isValid) {
        throw new CustomValidationError('Invalid scheme code', validationResult.errors);
      }

      // Get user's portfolio
      const portfolio = await Portfolio.findOne({ userId });
      
      if (!portfolio) {
        return res.status(404).json(
          PortfolioResponse.formatErrorResponse('Portfolio not found', 'User does not have a portfolio')
        );
      }

      // Remove fund from portfolio
      const result = await portfolio.removeAllUnits(parseInt(schemeCode));
      
      if (!result.status) {
        if (result.message.includes('not found')) {
          return res.status(404).json(
            PortfolioResponse.formatErrorResponse('Fund not found in portfolio', result.message)
          );
        }
        
        return res.status(500).json(
          PortfolioResponse.formatErrorResponse('Failed to remove fund from portfolio', result.message)
        );
      }

      res.status(200).json(
        PortfolioResponse.formatRemoveFundResponse(result.data)
      );

    } catch (error) {
      console.error('Remove fund from portfolio error:', error);
      
      if (error instanceof CustomValidationError) {
        return res.status(400).json(
          PortfolioResponse.formatValidationErrorResponse('Invalid request parameters', error.errors)
        );
      }
      
      res.status(500).json(
        PortfolioResponse.formatErrorResponse('Failed to remove fund from portfolio. Please try again.')
      );
    }
  }
}

export default PortfolioController;
