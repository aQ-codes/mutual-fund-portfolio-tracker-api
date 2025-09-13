/**
 * NAV Helper Functions
 * Utility functions for parsing and processing NAV data from external APIs
 */

class NavHelpers {
  /**
   * Parse and validate NAV data from external API response
   * @param {Object} apiResponse - Raw response from external API
   * @returns {Object|null} - Parsed fund data or null if invalid
   */
  static parseNavData(apiResponse) {
    if (!apiResponse || !apiResponse.data) {
      console.error('NavHelpers.parseNavData: Invalid apiResponse structure:', apiResponse);
      return null;
    }

    const responseData = apiResponse.data;
    
    // Handle different API response formats
    let fundMeta, navData;
    
    if (responseData.meta && responseData.data) {
      // New API format with meta and data structure
      fundMeta = responseData.meta;
      navData = responseData.data;
    } else {
      // Legacy format or direct fund data
      fundMeta = responseData;
      navData = responseData.data || [];
    }
    
    // Validate required fields (handle both camelCase and snake_case)
    const schemeCode = fundMeta.schemeCode || fundMeta.scheme_code;
    const schemeName = fundMeta.schemeName || fundMeta.scheme_name;
    const fundHouse = fundMeta.fundHouse || fundMeta.fund_house;
    const schemeType = fundMeta.schemeType || fundMeta.scheme_type;
    const schemeCategory = fundMeta.schemeCategory || fundMeta.scheme_category;
    const isinGrowth = fundMeta.isinGrowth || fundMeta.isin_growth;
    const isinDivReinvestment = fundMeta.isinDivReinvestment || fundMeta.isin_div_reinvestment;
    
    if (!schemeCode || !schemeName || !fundHouse || !schemeType || !schemeCategory) {
      console.error('NavHelpers.parseNavData: Missing required fields in fundData:', fundMeta);
      return null;
    }

    const parsedSchemeCode = parseInt(schemeCode);
    if (isNaN(parsedSchemeCode)) {
      console.error('NavHelpers.parseNavData: Invalid schemeCode:', schemeCode);
      return null;
    }
    
    return {
      schemeCode: parsedSchemeCode,
      schemeName: schemeName?.trim(),
      isinGrowth: isinGrowth?.trim() || null,
      isinDivReinvestment: isinDivReinvestment?.trim() || null,
      fundHouse: fundHouse?.trim(),
      schemeType: schemeType?.trim(),
      schemeCategory: schemeCategory?.trim(),
      navHistory: Array.isArray(navData) ? navData.map(item => ({
        date: item.date,
        nav: parseFloat(item.nav)
      })).filter(item => !isNaN(item.nav)) : []
    };
  }

  /**
   * Filter active funds based on scheme code range
   * @param {Array} funds - Array of fund objects
   * @param {number} minSchemeCode - Minimum scheme code (default: 150507)
   * @param {number} maxSchemeCode - Maximum scheme code (default: 153826)
   * @returns {Array} - Filtered array of active funds
   */
  static filterActiveFunds(funds, minSchemeCode = 150507, maxSchemeCode = 153826) {
    if (!Array.isArray(funds)) {
      return [];
    }

    return funds.filter(fund => 
      fund.schemeCode >= minSchemeCode && fund.schemeCode <= maxSchemeCode
    );
  }

  /**
   * Extract recent NAV history from parsed data
   * @param {Object} parsedData - Parsed fund data
   * @param {number} days - Number of recent days to extract (default: 30)
   * @returns {Array} - Array of recent NAV entries
   */
  static getRecentNavHistory(parsedData, days = 30) {
    if (!parsedData || !parsedData.navHistory || !Array.isArray(parsedData.navHistory)) {
      return [];
    }

    // API returns data in descending order by date, so we slice from the beginning
    return parsedData.navHistory.slice(0, days);
  }

  /**
   * Validate NAV data structure
   * @param {Object} navData - NAV data object to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  static validateNavData(navData) {
    if (!navData || typeof navData !== 'object') {
      return false;
    }

    const requiredFields = ['schemeCode', 'schemeName'];
    const hasRequiredFields = requiredFields.every(field => 
      navData.hasOwnProperty(field) && navData[field] !== null && navData[field] !== undefined
    );

    if (!hasRequiredFields) {
      return false;
    }

    // Validate scheme code is a number
    if (typeof navData.schemeCode !== 'number' || isNaN(navData.schemeCode)) {
      return false;
    }

    // Validate NAV history if present
    if (navData.navHistory && !Array.isArray(navData.navHistory)) {
      return false;
    }

    return true;
  }

  /**
   * Process batch results from multiple API calls
   * @param {Array} results - Array of Promise.allSettled results
   * @param {Array} schemeCodes - Array of scheme codes corresponding to results
   * @returns {Array} - Processed results with success/error information
   */
  static processBatchResults(results, schemeCodes) {
    return results.map((result, index) => ({
      schemeCode: schemeCodes[index],
      success: result.status === 'fulfilled' && result.value.success,
      data: result.status === 'fulfilled' ? result.value.data : null,
      error: result.status === 'rejected' ? result.reason : 
             (result.value && !result.value.success ? result.value.error : null)
    }));
  }

  /**
   * Create delay for rate limiting
   * @param {number} milliseconds - Delay in milliseconds
   * @returns {Promise} - Promise that resolves after delay
   */
  static createDelay(milliseconds = 1000) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
  }

  /**
   * Validate and parse NAV value
   * @param {string|number} navValue - NAV value to parse
   * @returns {number|null} - Parsed NAV value or null if invalid
   */
  static parseNavValue(navValue) {
    if (navValue === null || navValue === undefined || navValue === '') {
      return null;
    }

    const parsed = parseFloat(navValue);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Format date string for consistency
   * @param {string} dateString - Date string to format
   * @returns {string} - Formatted date string
   */
  static formatDateString(dateString) {
    if (!dateString || typeof dateString !== 'string') {
      return '';
    }

    // Return as-is since the API provides dates in DD-MM-YYYY format
    return dateString.trim();
  }
}

export default NavHelpers;
