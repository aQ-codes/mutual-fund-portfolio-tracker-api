class TransactionRequest {
  /**
   * Validate transaction query parameters
   * @param {Object} data - Query parameters
   * @returns {Object} Validation result
   */
  static validateTransactionQuery(data) {
    const errors = [];
    const validatedData = {};

    // Validate schemeCode (optional)
    if (data.schemeCode !== null && data.schemeCode !== undefined) {
      if (!Number.isInteger(data.schemeCode) || data.schemeCode < 100000 || data.schemeCode > 999999) {
        errors.push('Scheme code must be a 6-digit number');
      } else {
        validatedData.schemeCode = data.schemeCode;
      }
    } else {
      validatedData.schemeCode = null;
    }

    // Validate page (optional, default 1)
    if (data.page !== undefined) {
      if (!Number.isInteger(data.page) || data.page < 1) {
        errors.push('Page must be a positive integer');
      } else {
        validatedData.page = data.page;
      }
    } else {
      validatedData.page = 1;
    }

    // Validate limit (optional, default 50, max 100)
    if (data.limit !== undefined) {
      if (!Number.isInteger(data.limit) || data.limit < 1 || data.limit > 100) {
        errors.push('Limit must be between 1 and 100');
      } else {
        validatedData.limit = data.limit;
      }
    } else {
      validatedData.limit = 50;
    }

    // Validate type (optional)
    if (data.type !== undefined) {
      if (!['BUY', 'SELL'].includes(data.type)) {
        errors.push('Type must be either BUY or SELL');
      } else {
        validatedData.type = data.type;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: validatedData
    };
  }
}

export default TransactionRequest;
