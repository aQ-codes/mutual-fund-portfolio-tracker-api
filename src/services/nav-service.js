import { mfApi } from '../config/axios.js';
import FundLatestNav from '../models/fund-latest-nav.js';
import FundNavHistory from '../models/fund-nav-history.js';
import Fund from '../models/funds.js';

class NavService {
  // Fetch latest NAV from external API with retry logic
  static async fetchLatestNav(schemeCode, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Fetching NAV for scheme ${schemeCode} (attempt ${attempt}/${maxRetries})`);
        
        const response = await mfApi.getFundLatest(schemeCode);
        
        if (!response.data || !response.data.data || !response.data.data[0]) {
          throw new Error('Invalid response format from external API');
        }
        
        const navData = response.data.data[0];
        const metaData = response.data.meta;
        
        // Validate NAV data
        if (!navData.nav || !navData.date) {
          throw new Error('Missing NAV or date in response');
        }
        
        // Convert date string to Date object
        const dateObj = navData.date.includes('-') ? 
          new Date(navData.date.split('-').reverse().join('-')) : 
          new Date(navData.date);
        
        return {
          success: true,
          data: {
            nav: parseFloat(navData.nav),
            date: dateObj,
            // Include metadata for fund details
            meta: metaData ? {
              fundHouse: metaData.fund_house,
              schemeType: metaData.scheme_type,
              schemeCategory: metaData.scheme_category,
              schemeName: metaData.scheme_name,
              isinGrowth: metaData.isin_growth,
              isinDivReinvestment: metaData.isin_div_reinvestment
            } : null
          }
        };
        
      } catch (error) {
        console.error(`Attempt ${attempt} failed for scheme ${schemeCode}:`, error.message);
        
        if (attempt === maxRetries) {
          return {
            success: false,
            error: `Failed after ${maxRetries} attempts: ${error.message}`
          };
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Fetch NAV history from external API
  static async fetchNavHistory(schemeCode, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Fetching NAV history for scheme ${schemeCode} (attempt ${attempt}/${maxRetries})`);
        
        const response = await mfApi.getFundHistory(schemeCode);
        
        if (!response.data || !response.data.data) {
          throw new Error('Invalid response format from external API');
        }
        
        const historyData = response.data.data;
        const metaData = response.data.meta;
        
        return {
          success: true,
          data: {
            history: historyData.map(item => {
              const dateObj = item.date.includes('-') ? 
                new Date(item.date.split('-').reverse().join('-')) : 
                new Date(item.date);
              return {
                date: dateObj,
                nav: parseFloat(item.nav)
              };
            }),
            meta: metaData ? {
              fundHouse: metaData.fund_house,
              schemeType: metaData.scheme_type,
              schemeCategory: metaData.scheme_category,
              schemeName: metaData.scheme_name,
              isinGrowth: metaData.isin_growth,
              isinDivReinvestment: metaData.isin_div_reinvestment
            } : null
          }
        };
        
      } catch (error) {
        console.error(`Attempt ${attempt} failed for scheme ${schemeCode} history:`, error.message);
        
        if (attempt === maxRetries) {
          return {
            success: false,
            error: `Failed after ${maxRetries} attempts: ${error.message}`
          };
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Get latest NAV (from database first, then API if needed)
  static async getLatestNav(schemeCode) {
    try {
      // First try to get from database
      const latestNav = await FundLatestNav.findOne({ schemeCode });
      
      if (latestNav) {
        return {
          success: true,
          data: {
            nav: latestNav.nav,
            date: latestNav.date,
            source: 'database',
            updatedAt: latestNav.updatedAt
          }
        };
      }
      
      // If not in database, fetch from external API
      const apiResult = await this.fetchLatestNav(schemeCode);
      
      if (!apiResult.success) {
        return apiResult;
      }
      
      // Store in database for future use
      await FundLatestNav.updateNav(schemeCode, apiResult.data.nav, apiResult.data.date);
      
      return {
        success: true,
        data: {
          nav: apiResult.data.nav,
          date: apiResult.data.date,
          source: 'api',
          meta: apiResult.data.meta
        }
      };
      
    } catch (error) {
      console.error('Error getting latest NAV:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get NAV history with optional date range and limit
  static async getNavHistory(schemeCode, options = {}) {
    try {
      const { days = 30, startDate, endDate, source = 'database' } = options;
      
      if (source === 'database') {
        // Try to get from database first
        let history;
        
        if (startDate && endDate) {
          history = await FundNavHistory.getHistoryByDateRange(schemeCode, startDate, endDate);
        } else {
          history = await FundNavHistory.getRecentHistory(schemeCode, days);
        }
        
        if (history && history.length > 0) {
          return {
            success: true,
            data: {
              schemeCode,
              history: history.map(item => ({
                date: item.date,
                nav: item.nav
              })),
              source: 'database',
              count: history.length
            }
          };
        }
      }
      
      // If not in database or source is 'api', fetch from external API
      const apiResult = await this.fetchNavHistory(schemeCode);
      
      if (!apiResult.success) {
        return apiResult;
      }
      
      let history = apiResult.data.history;
      
      // Apply date filtering if specified
      if (startDate || endDate || days < history.length) {
        if (days && !startDate && !endDate) {
          // Get last N days
          history = history.slice(0, days);
        }
        // Note: For date range filtering, would need to implement date comparison with DD-MM-YYYY format
      }
      
      // Store in database for future use (optional, for caching)
      if (history.length > 0) {
        const historyData = history.map(item => ({
          schemeCode,
          nav: item.nav,
          date: item.date
        }));
        
        // Bulk upsert (fire and forget, don't wait)
        FundNavHistory.bulkUpsert(historyData).catch(err => 
          console.error('Error caching history data:', err)
        );
      }
      
      return {
        success: true,
        data: {
          schemeCode,
          history,
          source: 'api',
          count: history.length,
          meta: apiResult.data.meta
        }
      };
      
    } catch (error) {
      console.error('Error getting NAV history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get fund with latest NAV
  static async getFundWithNav(schemeCode) {
    try {
      // Get fund details
      const fund = await Fund.findOne({ schemeCode });
      
      if (!fund) {
        return {
          success: false,
          error: 'Fund not found'
        };
      }
      
      // Get latest NAV
      const navResult = await this.getLatestNav(schemeCode);
      
      return {
        success: true,
        data: {
          fund: fund.toObject(),
          nav: navResult.success ? navResult.data : null,
          navError: navResult.success ? null : navResult.error
        }
      };
      
    } catch (error) {
      console.error('Error getting fund with NAV:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Bulk update NAVs (for cron job)
  static async bulkUpdateNavs(schemeCodes, options = {}) {
    const { batchSize = 5, delayBetweenBatches = 2000, delayBetweenRequests = 300 } = options;
    
    const results = {
      total: schemeCodes.length,
      successful: [],
      failed: []
    };
    
    // Process in batches
    for (let i = 0; i < schemeCodes.length; i += batchSize) {
      const batch = schemeCodes.slice(i, i + batchSize);
      console.log(`Processing NAV batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(schemeCodes.length / batchSize)}`);
      
      // Process batch sequentially to avoid overwhelming the API
      for (const schemeCode of batch) {
        try {
            const result = await this.fetchLatestNav(schemeCode);
            
            if (result.success) {
              // Update database
              await FundLatestNav.updateNav(schemeCode, result.data.nav, result.data.date);
            results.successful.push({
              schemeCode,
              nav: result.data.nav,
              date: result.data.date
            });
          } else {
            results.failed.push({
              schemeCode,
              error: result.error
            });
          }
          
          // Delay between requests
          if (delayBetweenRequests > 0) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
          }
          
        } catch (error) {
          results.failed.push({
            schemeCode,
            error: error.message
          });
        }
      }
      
      // Delay between batches
      if (i + batchSize < schemeCodes.length && delayBetweenBatches > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }
    
    return results;
  }

  /**
   * Get latest NAVs for multiple scheme codes
   * @param {number[]} schemeCodes - Array of scheme codes
   * @returns {Promise<Object[]>} Array of latest NAV data
   */
  static async bulkGetLatestNavs(schemeCodes) {
    if (!schemeCodes || schemeCodes.length === 0) {
      return [];
    }

    try {
      // Get latest NAVs from database first
      const latestNavs = await FundLatestNav.find({ 
        schemeCode: { $in: schemeCodes } 
      });

      const results = [];
      const missingSchemes = [];

      // Check which schemes have data in database
      schemeCodes.forEach(schemeCode => {
        const navData = latestNavs.find(nav => nav.schemeCode === schemeCode);
        if (navData) {
          results.push({
            schemeCode: navData.schemeCode,
            nav: navData.nav,
            date: navData.date
          });
        } else {
          missingSchemes.push(schemeCode);
        }
      });

      // Fetch missing NAVs from API if needed
      if (missingSchemes.length > 0) {
        console.log(`Fetching NAVs from API for ${missingSchemes.length} schemes`);
        
        for (const schemeCode of missingSchemes) {
          try {
            const navData = await this.fetchLatestNav(schemeCode);
            if (navData && navData.nav) {
              // Save to database
              await this.saveLatestNav(schemeCode, navData.nav, navData.date);
              
              results.push({
                schemeCode,
                nav: navData.nav,
                date: navData.date
              });
            }
          } catch (error) {
            console.error(`Failed to fetch NAV for scheme ${schemeCode}:`, error.message);
            // Add placeholder with 0 NAV to prevent errors
            results.push({
              schemeCode,
              nav: 0,
              date: new Date().toISOString().split('T')[0]
            });
          }
        }
      }

      return results;
    } catch (error) {
      console.error('Error in bulkGetLatestNavs:', error);
      // Return empty NAVs to prevent errors
      return schemeCodes.map(schemeCode => ({
        schemeCode,
        nav: 0,
        date: new Date().toISOString().split('T')[0]
      }));
    }
  }

  /**
   * Save latest NAV to database by fundId
   * @param {ObjectId} fundId - Fund ObjectId
   * @param {number} schemeCode - Scheme code
   * @param {number} nav - NAV value
   * @param {Date} date - Date object
   */
  static async saveLatestNavByFundId(fundId, schemeCode, nav, date) {
    try {
      await FundLatestNav.updateNavByFundId(fundId, schemeCode, parseFloat(nav), date);
    } catch (error) {
      console.error(`Error saving latest NAV for fund ${fundId}:`, error);
      throw error;
    }
  }

  /**
   * Save latest NAV to database (backward compatibility)
   * @param {number} schemeCode - Scheme code
   * @param {number} nav - NAV value
   * @param {Date|string} date - Date object or string
   */
  static async saveLatestNav(schemeCode, nav, date) {
    try {
      const dateObj = date instanceof Date ? date : 
        (typeof date === 'string' && date.includes('-') ? 
          new Date(date.split('-').reverse().join('-')) : 
          new Date(date));

      await FundLatestNav.findOneAndUpdate(
        { schemeCode },
        { 
          schemeCode,
          nav: parseFloat(nav),
          date: dateObj,
          updatedAt: new Date()
        },
        { 
          upsert: true,
          new: true
        }
      );
    } catch (error) {
      console.error(`Error saving latest NAV for scheme ${schemeCode}:`, error);
      throw error;
    }
  }

  /**
   * Save NAV to history collection by fundId
   * @param {ObjectId} fundId - Fund ObjectId
   * @param {number} schemeCode - Scheme code
   * @param {number} nav - NAV value
   * @param {Date} date - Date object
   */
  static async saveNavHistoryByFundId(fundId, schemeCode, nav, date) {
    try {
      // Check if entry already exists for this fund and date
      const existing = await FundNavHistory.findOne({ fundId, date });
      
      if (!existing) {
        await FundNavHistory.create({
          fundId,
          schemeCode,
          nav: parseFloat(nav),
          date
        });
        
        // Maintain 50 entry limit
        await FundNavHistory.maintainHistoryLimit(fundId, 30);
      }
    } catch (error) {
      console.error(`Error saving NAV history for fund ${fundId}:`, error);
      throw error;
    }
  }

  /**
   * Save NAV to history collection (backward compatibility)
   * @param {number} schemeCode - Scheme code
   * @param {number} nav - NAV value
   * @param {Date|string} date - Date object or string
   */
  static async saveLatestNavByFundId(fundId, schemeCode, nav, date) {
    try {
      const dateObj = date instanceof Date ? date : 
        (typeof date === 'string' && date.includes('-') ? 
          new Date(date.split('-').reverse().join('-')) : 
          new Date(date));
      await FundLatestNav.updateNavByFundId(fundId, schemeCode, parseFloat(nav), dateObj);
    } catch (error) {
      console.error(`Error saving latest NAV for fundId ${fundId}:`, error);
      throw error;
    }
  }

  static async saveNavHistoryByFundId(fundId, schemeCode, nav, date) {
    try {
      const dateObj = date instanceof Date ? date : 
        (typeof date === 'string' && date.includes('-') ? 
          new Date(date.split('-').reverse().join('-')) : 
          new Date(date));
      await FundNavHistory.addNavEntry(fundId, schemeCode, parseFloat(nav), dateObj);
    } catch (error) {
      console.error(`Error saving NAV history for fundId ${fundId}:`, error);
      throw error;
    }
  }

  static async saveNavHistory(schemeCode, nav, date) {
    try {
      const fund = await Fund.findOne({ schemeCode });
      if (!fund) {
        throw new Error(`Fund not found for scheme ${schemeCode}`);
      }
      await this.saveNavHistoryByFundId(fund._id, schemeCode, nav, date);
    } catch (error) {
      console.error(`Error saving NAV history for scheme ${schemeCode}:`, error);
      throw error;
    }
  }
}

export default NavService;
