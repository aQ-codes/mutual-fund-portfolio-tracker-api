import UserRepository from '../../repositories/user-repository.js';
import PortfolioRepository from '../../repositories/portfolio-repository.js';
import TransactionRepository from '../../repositories/transaction-repository.js';
import FundRepository from '../../repositories/fund-repository.js';
import HoldingRepository from '../../repositories/holding-repository.js';
import FundLatestNav from '../../models/fund-latest-nav.js';
import AdminRequest from '../../requests/admin/admin-request.js';
import AdminResponse from '../../responses/admin/admin-response.js';
import CronService from '../../services/cron-service.js';
import CustomValidationError from '../../exceptions/custom-validation-error.js';

class AdminController {
  // GET /api/admin/users - List all users
  static async getUsers(req, res) {
    try {
      // Validate query parameters
      const validationResult = AdminRequest.validateUsersQuery(req.query);
      if (!validationResult.isValid) {
        throw new CustomValidationError('Validation failed', validationResult.errors);
      }

      const { page, limit, search, role } = validationResult.data;

      // Build query
      const query = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      if (role) {
        query.role = role;
      }

      // Get users with pagination
      const skip = (page - 1) * limit;
      const [users, totalUsers] = await Promise.all([
        UserRepository.findWithQuery(query, {
          page,
          limit,
          sortBy: 'createdAt',
          sortOrder: -1
        }),
        UserRepository.countByQuery(query)
      ]);

      // Format response
      const responseData = AdminResponse.formatUsersResponse(users, {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNext: page < Math.ceil(totalUsers / limit),
        hasPrev: page > 1
      });

      res.status(200).json({
        success: true,
        data: responseData
      });

    } catch (error) {
      console.error('Error fetching users:', error);

      if (error instanceof CustomValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // GET /api/admin/portfolios - View all portfolios
  static async getPortfolios(req, res) {
    try {
      // Validate query parameters
      const validationResult = AdminRequest.validatePortfoliosQuery(req.query);
      if (!validationResult.isValid) {
        throw new CustomValidationError('Validation failed', validationResult.errors);
      }

      const { page, limit, userId } = validationResult.data;

      // Build query
      const query = {};
      if (userId) {
        query.userId = userId;
      }

      // Get portfolios with user details
      const skip = (page - 1) * limit;
      const [portfolios, totalPortfolios] = await Promise.all([
        Portfolio.find(query)
          .populate('userId', 'name email')
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit),
        Portfolio.countDocuments(query)
      ]);

      // Format response
      const responseData = AdminResponse.formatPortfoliosResponse(portfolios, {
        currentPage: page,
        totalPages: Math.ceil(totalPortfolios / limit),
        totalPortfolios,
        hasNext: page < Math.ceil(totalPortfolios / limit),
        hasPrev: page > 1
      });

      res.status(200).json({
        success: true,
        data: responseData
      });

    } catch (error) {
      console.error('Error fetching portfolios:', error);

      if (error instanceof CustomValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch portfolios',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // GET /api/admin/popular-funds - Most invested funds
  static async getPopularFunds(req, res) {
    try {
      const validationResult = AdminRequest.validatePopularFundsQuery(req.query);
      if (!validationResult.isValid) {
        throw new CustomValidationError('Validation failed', validationResult.errors);
      }

      const { limit } = validationResult.data;

      // Aggregate most popular funds by total units held
      const popularFunds = await Portfolio.aggregate([
        { $unwind: '$holdings' },
        {
          $group: {
            _id: '$holdings.schemeCode',
            totalInvestors: { $sum: 1 },
            totalUnits: { $sum: '$holdings.totalUnits' },
            avgUnitsPerInvestor: { $avg: '$holdings.totalUnits' }
          }
        },
        { $sort: { totalInvestors: -1, totalUnits: -1 } },
        { $limit: limit }
      ]);

      // Get fund details for popular funds
      const schemeCodes = popularFunds.map(fund => fund._id);
      const fundDetails = await Fund.find({ schemeCode: { $in: schemeCodes } });
      const latestNavs = await FundLatestNav.find({ schemeCode: { $in: schemeCodes } });

      // Format response
      const responseData = AdminResponse.formatPopularFundsResponse(
        popularFunds,
        fundDetails,
        latestNavs
      );

      res.status(200).json({
        success: true,
        data: responseData
      });

    } catch (error) {
      console.error('Error fetching popular funds:', error);

      if (error instanceof CustomValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message,
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch popular funds',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // GET /api/admin/stats - System statistics
  static async getSystemStats(req, res) {
    try {
      // Get various system statistics
      const [
        totalUsers,
        totalPortfolios,
        totalTransactions,
        totalFunds,
        activeUsers,
        totalInvestmentValue,
        recentTransactions
      ] = await Promise.all([
        User.countDocuments(),
        Portfolio.countDocuments({ 'holdings.0': { $exists: true } }), // Non-empty portfolios
        Transaction.countDocuments(),
        Fund.countDocuments(),
        User.countDocuments({ 
          updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }),
        AdminController.calculateTotalInvestmentValue(),
        Transaction.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('userId', 'name email')
      ]);

      // Get user growth (last 12 months)
      const userGrowth = await AdminController.getUserGrowthStats();

      // Get portfolio distribution by value ranges
      const portfolioDistribution = await AdminController.getPortfolioDistribution();

      // Format response
      const responseData = AdminResponse.formatSystemStatsResponse({
        totalUsers,
        totalPortfolios,
        totalTransactions,
        totalFunds,
        activeUsers,
        totalInvestmentValue,
        userGrowth,
        portfolioDistribution,
        recentTransactions
      });

      res.status(200).json({
        success: true,
        data: responseData
      });

    } catch (error) {
      console.error('Error fetching system stats:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch system statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // GET /api/admin/cron-status - Get cron job status
  static async getCronStatus(req, res) {
    try {
      const jobStatus = CronService.getJobStatus();
      
      res.status(200).json({
        success: true,
        data: {
          jobs: jobStatus,
          lastUpdate: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error fetching cron status:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to fetch cron job status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // POST /api/admin/cron/run-nav-update - Manually trigger NAV update
  static async runNavUpdate(req, res) {
    try {
      // Run NAV update in background
      CronService.runDailyNavUpdateNow().catch(error => {
        console.error('Manual NAV update failed:', error);
      });

      res.status(202).json({
        success: true,
        message: 'NAV update job started. Check logs for progress.'
      });

    } catch (error) {
      console.error('Error starting manual NAV update:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to start NAV update',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  // Helper method to calculate total investment value
  static async calculateTotalInvestmentValue() {
    try {
      const result = await Portfolio.aggregate([
        { $unwind: '$holdings' },
        { $unwind: '$holdings.lots' },
        {
          $group: {
            _id: null,
            totalValue: { 
              $sum: { 
                $multiply: ['$holdings.lots.units', '$holdings.lots.pricePerUnit'] 
              } 
            }
          }
        }
      ]);

      return result.length > 0 ? result[0].totalValue : 0;
    } catch (error) {
      console.error('Error calculating total investment value:', error);
      return 0;
    }
  }

  // Helper method to get user growth statistics
  static async getUserGrowthStats() {
    try {
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const userGrowth = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: twelveMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1 }
        }
      ]);

      return userGrowth.map(item => ({
        month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
        users: item.count
      }));
    } catch (error) {
      console.error('Error getting user growth stats:', error);
      return [];
    }
  }

  // Helper method to get portfolio distribution
  static async getPortfolioDistribution() {
    try {
      // This would require current NAV data to calculate portfolio values
      // For now, return a placeholder implementation
      return {
        '0-10000': 0,
        '10000-50000': 0,
        '50000-100000': 0,
        '100000-500000': 0,
        '500000+': 0
      };
    } catch (error) {
      console.error('Error getting portfolio distribution:', error);
      return {};
    }
  }
}

export default AdminController;
