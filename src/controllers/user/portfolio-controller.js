import FundRepository from '../../repositories/fund-repository.js';
import PortfolioRepository from '../../repositories/portfolio-repository.js';
import TransactionRepository from '../../repositories/transaction-repository.js';
import NavService from '../../services/nav-service.js';
import PortfolioService from '../../services/portfolio-service.js';
import PortfolioRequest from '../../requests/user/portfolio-request.js';
import PortfolioResponse from '../../responses/user/portfolio-response.js';
import CustomValidationError from '../../exceptions/custom-validation-error.js';
import PortfolioHelpers from '../../helpers/portfolio-helpers.js';
import DateUtils from '../../utils/date-utils.js';

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
      const fund = await FundRepository.findBySchemeCode(schemeCode);
      if (!fund) {
        return res.status(404).json({
          success: false,
          message: 'Fund not found with the provided scheme code'
        });
      }

      // Get latest NAV for the fund
      const navData = await NavService.getLatestNav(schemeCode);
      if (!navData || !navData.success || !navData.data || !navData.data.nav) {
        return res.status(400).json({
          success: false,
          message: 'Unable to fetch current NAV for this fund. Please try again later.'
        });
      }

      // Add units to portfolio using service
      const result = await PortfolioService.addUnits(userId, schemeCode, units, navData.data.nav, new Date());

      // Format response with appropriate message
      const responseData = PortfolioResponse.formatAddFundResponse({
        portfolioId: result.portfolioId,
        schemeCode,
        schemeName: fund.schemeName,
        units,
        addedAt: new Date(),
        isNewPortfolio: result.isNewPortfolio,
        transactionId: result.transaction._id,
        nav: navData.data.nav,
        amount: units * navData.data.nav
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

      // Calculate portfolio value using service
      const portfolioValue = await PortfolioService.calculatePortfolioValue(userId);
      
      if (!portfolioValue.holdings || portfolioValue.holdings.length === 0) {
        return res.status(200).json(
          PortfolioResponse.formatEmptyPortfolioResponse('Your portfolio is empty')
        );
      }

      res.status(200).json(
        PortfolioResponse.formatPortfolioValueResponse(portfolioValue)
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

      // Get user's portfolio using repository
      const portfolioData = await PortfolioRepository.getUserPortfoliosWithDetails(userId);
      
      if (!portfolioData || portfolioData.length === 0) {
        return res.status(200).json(
          PortfolioResponse.formatEmptyPortfolioResponse('Your portfolio is empty')
        );
      }

      // Transform data for response formatter
      const holdings = [];
      for (const item of portfolioData) {
        if (item.holding && item.holding.totalUnits > 0 && item.fund) {
          // Get current NAV
          const navData = await NavService.getLatestNav(item.portfolio.schemeCode);
          const currentNav = navData.success ? navData.data.nav : item.holding.avgNav;
          
          // Get recent transactions for this fund (last 5)
          const recentTransactions = await PortfolioService.getTransactionHistory(
            userId, 
            item.portfolio.schemeCode,
            { page: 1, limit: 5 }
          );
          
          holdings.push({
            schemeCode: item.portfolio.schemeCode,
            schemeName: item.fund.schemeName,
            units: item.holding.totalUnits,
            currentNav: currentNav,
            currentValue: item.holding.totalUnits * currentNav,
            avgNav: item.holding.avgNav,
            investedValue: item.holding.investedValue,
            profitLoss: (item.holding.totalUnits * currentNav) - item.holding.investedValue,
            recentTransactions: recentTransactions.map(tx => ({
              id: tx._id,
              type: tx.type,
              units: tx.units,
              nav: tx.nav,
              amount: tx.amount,
              date: DateUtils.formatToApiDate(tx.date)
            }))
          });
        }
      }

      const responseData = {
        totalHoldings: holdings.length,
        holdings: holdings
      };

      res.status(200).json(
        PortfolioResponse.formatPortfolioListResponse(responseData)
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
      const validationResult = PortfolioRequest.validateSchemeCode(parseInt(schemeCode));
      if (!validationResult.isValid) {
        throw new CustomValidationError('Invalid scheme code', validationResult.errors);
      }

      // Remove fund using service
      const result = await PortfolioService.removeFund(userId, parseInt(schemeCode));

      if (!result.status) {
        return res.status(400).json(
          PortfolioResponse.formatErrorResponse(result.message)
        );
      }

      res.status(200).json({
        success: true,
        message: result.message
      });

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

  // POST /api/portfolio/sell - Sell units from portfolio
  static async sellFund(req, res) {
    try {
      // Validate request
      const validationResult = PortfolioRequest.validateSellFund(req.body);
      if (!validationResult.isValid) {
        throw new CustomValidationError('Validation failed', validationResult.errors);
      }

      const { schemeCode, units } = validationResult.data;
      const userId = req.user.id;

      // Check if fund exists
      const fund = await FundRepository.findBySchemeCode(schemeCode);
      if (!fund) {
        return res.status(404).json({
          success: false,
          message: 'Fund not found with the provided scheme code'
        });
      }

      // Get latest NAV for the fund
      const navData = await NavService.getLatestNav(schemeCode);
      if (!navData || !navData.success || !navData.data || !navData.data.nav) {
        return res.status(400).json({
          success: false,
          message: 'Unable to fetch current NAV for this fund. Please try again later.'
        });
      }

      // Sell units using service
      const result = await PortfolioService.removeUnits(userId, schemeCode, units, navData.data.nav, new Date());

      // Format response
      const responseData = PortfolioResponse.formatSellFundResponse({
        schemeCode,
        schemeName: fund.schemeName,
        units,
        nav: navData.data.nav,
        saleAmount: units * navData.data.nav,
        realizedPL: result.realizedPL,
        date: new Date(),
        transactionId: result.transaction._id
      });

      res.status(200).json(responseData);

    } catch (error) {
      console.error('Sell fund from portfolio error:', error);
      
      if (error instanceof CustomValidationError) {
        return res.status(400).json(
          PortfolioResponse.formatValidationErrorResponse('Invalid request data', error.errors)
        );
      }
      
      res.status(500).json(
        PortfolioResponse.formatErrorResponse('Failed to sell fund from portfolio. Please try again.')
      );
    }
  }
}

export default PortfolioController;
