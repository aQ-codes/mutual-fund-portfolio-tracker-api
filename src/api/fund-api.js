import { mfApi } from '../config/axios.js';
import config from '../config/env.js';
import NavHelpers from '../helpers/nav-helpers.js';

class FundApi {
  // Get all available mutual funds
  static async getAllFunds() {
    try {
      const response = await mfApi.getAllFunds();
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching all funds:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Get active funds (scheme codes between 150507 and 153826) - following full-project logic
  static async getActiveFunds(limit = 50) {
    try {
      const response = await mfApi.getAllFunds();
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from external API');
      }
      
      // Filter active funds using helper function
      const activeFunds = NavHelpers.filterActiveFunds(response.data);
      
      const limitedFunds = activeFunds.slice(0, limit);
      
      console.log(`Found ${activeFunds.length} active funds, taking ${limitedFunds.length}`);
      
      return {
        success: true,
        data: limitedFunds,
        totalActive: activeFunds.length,
        selected: limitedFunds.length
      };
    } catch (error) {
      console.error('Error fetching active funds:', error.message);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // Get fund details with full history
  static async getFundHistory(schemeCode) {
    try {
      const response = await mfApi.getFundHistory(schemeCode);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching fund history for scheme ${schemeCode}:`, error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Get latest NAV for a fund
  static async getLatestNav(schemeCode) {
    try {
      const response = await mfApi.getFundLatest(schemeCode);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error fetching latest NAV for scheme ${schemeCode}:`, error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // Get multiple funds' latest NAV (batch processing)
  static async getBatchLatestNav(schemeCodes) {
    const results = [];
    const batchSize = 5; // Process 5 at a time to avoid rate limiting
    
    for (let i = 0; i < schemeCodes.length; i += batchSize) {
      const batch = schemeCodes.slice(i, i + batchSize);
      const batchPromises = batch.map(schemeCode => this.getLatestNav(schemeCode));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
        
        // Add delay between batches to be respectful to the API
        if (i + batchSize < schemeCodes.length) {
          await NavHelpers.createDelay(1000); // 1 second delay
        }
      } catch (error) {
        console.error('Error in batch processing:', error);
      }
    }
    
    return NavHelpers.processBatchResults(results, schemeCodes);
  }

  // Helper method to parse and validate NAV data (delegates to helper)
  static parseNavData(apiResponse) {
    return NavHelpers.parseNavData(apiResponse);
  }

  // Get recent NAV history (last N days)
  static async getRecentHistory(schemeCode, days = 30) {
    try {
      const response = await this.getFundHistory(schemeCode);
      
      if (!response.success) {
        return response;
      }

      const parsedData = this.parseNavData(response);
      
      if (!parsedData || !parsedData.navHistory) {
        return {
          success: false,
          error: 'Invalid NAV data received',
          data: null
        };
      }

      // Get last N days of data using helper function
      const recentHistory = NavHelpers.getRecentNavHistory(parsedData, days);
      
      return {
        success: true,
        data: {
          ...parsedData,
          navHistory: recentHistory
        }
      };
    } catch (error) {
      console.error(`Error fetching recent history for scheme ${schemeCode}:`, error.message);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }
}

export default FundApi;
