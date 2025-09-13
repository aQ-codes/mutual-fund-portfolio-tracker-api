import Fund from '../models/funds.js';
import { CustomValidationError } from '../exceptions/custom-validation-error.js';

class FundRepository {
  // Create or update fund
  static async createOrUpdateFund(fundData) {
    try {
      const fund = await Fund.findOneAndUpdate(
        { schemeCode: fundData.schemeCode },
        {
          schemeCode: fundData.schemeCode,
          schemeName: fundData.schemeName,
          isinGrowth: fundData.isinGrowth,
          isinDivReinvestment: fundData.isinDivReinvestment,
          fundHouse: fundData.fundHouse,
          schemeType: fundData.schemeType,
          schemeCategory: fundData.schemeCategory
        },
        { 
          upsert: true, 
          new: true, 
          runValidators: true 
        }
      );
      
      return {
        status: true,
        data: fund
      };
    } catch (error) {
      console.error('Error creating/updating fund:', error);
      
      if (error.name === 'ValidationError') {
        throw CustomValidationError.fromMongooseError(error);
      }
      
      throw error;
    }
  }
  
  // Get all funds with pagination and search
  static async getFunds(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        category,
        fundHouse,
        sortBy = 'schemeName',
        sortOrder = 1
      } = options;
      
      const skip = (page - 1) * limit;
      const query = {};
      
      // Text search
      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        query.$or = [
          { schemeName: searchRegex },
          { fundHouse: searchRegex },
          { schemeCategory: searchRegex }
        ];
      }
      
      // Category filter
      if (category) {
        query.schemeCategory = new RegExp(category, 'i');
      }
      
      // Fund house filter
      if (fundHouse) {
        query.fundHouse = new RegExp(fundHouse, 'i');
      }
      
      // Execute query with pagination
      const [funds, total] = await Promise.all([
        Fund.find(query)
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(limit)
          .lean(),
        Fund.countDocuments(query)
      ]);
      
      const totalPages = Math.ceil(total / limit);
      
      return {
        status: true,
        data: {
          funds,
          pagination: {
            currentPage: page,
            totalPages,
            totalFunds: total,
            limit,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      };
    } catch (error) {
      console.error('Error fetching funds:', error);
      
      return {
        status: false,
        message: error.message
      };
    }
  }
  
  // Get fund by scheme code
  static async getFundBySchemeCode(schemeCode) {
    try {
      const fund = await Fund.findOne({ schemeCode });
      
      if (!fund) {
        return {
          status: false,
          message: 'Fund not found'
        };
      }
      
      return {
        status: true,
        data: fund
      };
    } catch (error) {
      console.error('Error fetching fund by scheme code:', error);
      
      return {
        status: false,
        message: error.message
      };
    }
  }
  
  // Get funds by category
  static async getFundsByCategory(category, options = {}) {
    const { page = 1, limit = 20 } = options;
    
    return this.getFunds({
      ...options,
      category,
      page,
      limit
    });
  }
  
  // Get funds by fund house
  static async getFundsByFundHouse(fundHouse, options = {}) {
    const { page = 1, limit = 20 } = options;
    
    return this.getFunds({
      ...options,
      fundHouse,
      page,
      limit
    });
  }
  
  // Get fund statistics
  static async getFundStats() {
    try {
      const [totalFunds, categories, fundHouses] = await Promise.all([
        Fund.countDocuments(),
        Fund.distinct('schemeCategory'),
        Fund.distinct('fundHouse')
      ]);
      
      return {
        status: true,
        data: {
          totalFunds,
          totalCategories: categories.length,
          totalFundHouses: fundHouses.length,
          categories: categories.sort(),
          fundHouses: fundHouses.sort()
        }
      };
    } catch (error) {
      console.error('Error fetching fund stats:', error);
      
      return {
        status: false,
        message: error.message
      };
    }
  }
  
  // Search funds by query
  static async searchFunds(searchOptions) {
    try {
      const {
        query,
        page = 1,
        limit = 20,
        sortBy = 'schemeName',
        sortOrder = 1
      } = searchOptions;
      
      if (!query || !query.trim()) {
        return {
          status: false,
          message: 'Search query is required'
        };
      }
      
      const skip = (page - 1) * limit;
      const searchRegex = new RegExp(query.trim(), 'i');
      
      // Build search query
      const mongoQuery = {
        $or: [
          { schemeName: searchRegex },
          { fundHouse: searchRegex },
          { schemeCategory: searchRegex },
          { schemeType: searchRegex }
        ]
      };
      
      // Execute search with pagination
      const [funds, total] = await Promise.all([
        Fund.find(mongoQuery)
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(limit)
          .lean(),
        Fund.countDocuments(mongoQuery)
      ]);
      
      const totalPages = Math.ceil(total / limit);
      
      return {
        status: true,
        data: {
          funds,
          pagination: {
            currentPage: page,
            totalPages,
            totalFunds: total,
            limit,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      };
    } catch (error) {
      console.error('Error searching funds:', error);
      
      return {
        status: false,
        message: error.message
      };
    }
  }

  // Get categories
  static async getCategories() {
    try {
      const categories = await Fund.distinct('schemeCategory');
      return {
        status: true,
        data: categories.sort()
      };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return {
        status: false,
        message: error.message
      };
    }
  }

  // Get fund houses
  static async getFundHouses() {
    try {
      const fundHouses = await Fund.distinct('fundHouse');
      return {
        status: true,
        data: fundHouses.sort()
      };
    } catch (error) {
      console.error('Error fetching fund houses:', error);
      return {
        status: false,
        message: error.message
      };
    }
  }

  // Find fund by ID
  static async findById(fundId) {
    try {
      return await Fund.findById(fundId);
    } catch (error) {
      console.error('Error finding fund by ID:', error);
      throw error;
    }
  }

  // Find fund by scheme code (direct method)
  static async findBySchemeCode(schemeCode) {
    try {
      return await Fund.findOne({ schemeCode });
    } catch (error) {
      console.error('Error finding fund by scheme code:', error);
      throw error;
    }
  }
}

export default FundRepository;
