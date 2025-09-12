import Portfolio from '../models/Portfolio.js';
import Fund from '../models/Fund.js';
import NavService from '../services/nav-service.js';
import PortfolioHelpers from '../helpers/portfolio-helpers.js';
import PortfolioRequest from '../requests/portfolio-request.js';
import PortfolioResponse from '../responses/portfolio-response.js';
import CustomValidationError from '../exceptions/custom-validation-error.js';

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
        amount: units * navData.nav,
        date: new Date()
      });

      res.status(201).json({
        success: true,
        message: 'Fund added to portfolio successfully',
        portfolio: responseData
      });

    } catch (error) {
      console.error('Error adding fund to portfolio:', error);

      if (error instanceof CustomValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to add fund to portfolio',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // GET /api/portfolio/value - Get current portfolio value with P&L calculation
  static async getPortfolioValue(req, res) {
    try {
      const userId = req.user.id;

      // Get user's portfolio
      const portfolio = await Portfolio.findByUserId(userId);
      if (!portfolio || portfolio.holdings.length === 0) {
        return res.status(200).json({
          success: true,
          data: PortfolioResponse.formatEmptyPortfolioValue()
        });
      }

      // Get latest NAVs for all holdings
      const schemeCodes = portfolio.holdings.map(h => h.schemeCode);
      const latestNavs = await NavService.bulkGetLatestNavs(schemeCodes);

      // Calculate portfolio value
      const portfolioValue = PortfolioHelpers.calculatePortfolioValue(portfolio.holdings, latestNavs);

      // Get fund details for holdings
      const funds = await Fund.find({ schemeCode: { $in: schemeCodes } });

      // Format response
      const responseData = PortfolioResponse.formatPortfolioValueResponse({
        ...portfolioValue,
        asOn: latestNavs.length > 0 ? latestNavs[0].date : new Date().toISOString().split('T')[0],
        holdings: portfolio.holdings.map(holding => {
          const fund = funds.find(f => f.schemeCode === holding.schemeCode);
          const latestNav = latestNavs.find(n => n.schemeCode === holding.schemeCode);
          const avgCost = PortfolioHelpers.calculateAverageCost(holding.lots);
          
          return {
            schemeCode: holding.schemeCode,
            schemeName: fund?.schemeName || `Fund ${holding.schemeCode}`,
            units: holding.totalUnits,
            currentNav: latestNav?.nav || 0,
            currentValue: holding.totalUnits * (latestNav?.nav || 0),
            investedValue: holding.lots.reduce((sum, lot) => sum + (lot.units * lot.pricePerUnit), 0),
            avgCost,
            profitLoss: (holding.totalUnits * (latestNav?.nav || 0)) - holding.lots.reduce((sum, lot) => sum + (lot.units * lot.pricePerUnit), 0)
          };
        })
      });

      res.status(200).json({
        success: true,
        data: responseData
      });

    } catch (error) {
      console.error('Error fetching portfolio value:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch portfolio value',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // GET /api/portfolio/list - Get user's complete portfolio
  static async getPortfolioList(req, res) {
    try {
      const userId = req.user.id;

      // Get user's portfolio
      const portfolio = await Portfolio.findByUserId(userId);
      if (!portfolio || portfolio.holdings.length === 0) {
        return res.status(200).json({
          success: true,
          data: PortfolioResponse.formatEmptyPortfolioList()
        });
      }

      // Get latest NAVs for all holdings
      const schemeCodes = portfolio.holdings.map(h => h.schemeCode);
      const latestNavs = await NavService.bulkGetLatestNavs(schemeCodes);

      // Get fund details
      const funds = await Fund.find({ schemeCode: { $in: schemeCodes } });

      // Format response
      const responseData = PortfolioResponse.formatPortfolioListResponse({
        totalHoldings: portfolio.holdings.length,
        holdings: portfolio.holdings.map(holding => {
          const fund = funds.find(f => f.schemeCode === holding.schemeCode);
          const latestNav = latestNavs.find(n => n.schemeCode === holding.schemeCode);
          
          return {
            schemeCode: holding.schemeCode,
            schemeName: fund?.schemeName || `Fund ${holding.schemeCode}`,
            units: holding.totalUnits,
            currentNav: latestNav?.nav || 0,
            currentValue: holding.totalUnits * (latestNav?.nav || 0)
          };
        })
      });

      res.status(200).json({
        success: true,
        data: responseData
      });

    } catch (error) {
      console.error('Error fetching portfolio list:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch portfolio list',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
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
        throw new CustomValidationError('Validation failed', validationResult.errors);
      }

      const parsedSchemeCode = validationResult.data.schemeCode;

      // Get user's portfolio
      const portfolio = await Portfolio.findByUserId(userId);
      if (!portfolio) {
        return res.status(404).json({
          success: false,
          message: 'Portfolio not found'
        });
      }

      // Check if fund exists in portfolio
      const holding = portfolio.getHolding(parsedSchemeCode);
      if (!holding) {
        return res.status(404).json({
          success: false,
          message: 'Fund not found in your portfolio'
        });
      }

      // Remove the holding
      const holdingIndex = portfolio.holdings.findIndex(h => h.schemeCode === parsedSchemeCode);
      portfolio.holdings.splice(holdingIndex, 1);

      // Add sell transactions for all lots
      const currentNav = await NavService.getLatestNav(parsedSchemeCode);
      holding.lots.forEach(lot => {
        portfolio.transactions.push({
          type: 'SELL',
          schemeCode: parsedSchemeCode,
          units: lot.units,
          pricePerUnit: currentNav?.nav || lot.pricePerUnit,
          amount: lot.units * (currentNav?.nav || lot.pricePerUnit),
          date: new Date(),
          navUsed: currentNav?.nav || lot.pricePerUnit
        });
      });

      await portfolio.save();

      res.status(200).json({
        success: true,
        message: 'Fund removed from portfolio successfully'
      });

    } catch (error) {
      console.error('Error removing fund from portfolio:', error);

      if (error instanceof CustomValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to remove fund from portfolio',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // GET /api/portfolio/history - Get portfolio value history
  static async getPortfolioHistory(req, res) {
    try {
      const userId = req.user.id;

      // Validate query parameters
      const validationResult = PortfolioRequest.validateHistoryQuery(req.query);
      if (!validationResult.isValid) {
        throw new CustomValidationError('Validation failed', validationResult.errors);
      }

      const { startDate, endDate, days } = validationResult.data;

      // Get user's portfolio
      const portfolio = await Portfolio.findByUserId(userId);
      if (!portfolio || portfolio.holdings.length === 0) {
        return res.status(200).json({
          success: true,
          data: []
        });
      }

      // For now, return a simplified history - this would need actual historical NAV data
      // This is a placeholder implementation
      const history = PortfolioHelpers.calculatePortfolioHistory(portfolio.holdings, [], days);

      res.status(200).json({
        success: true,
        data: history
      });

    } catch (error) {
      console.error('Error fetching portfolio history:', error);

      if (error instanceof CustomValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch portfolio history',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

export default PortfolioController;
