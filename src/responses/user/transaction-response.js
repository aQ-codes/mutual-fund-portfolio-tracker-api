class TransactionResponse {
  /**
   * Format successful transactions list response
   * @param {Array} transactions - List of transactions
   * @returns {Object} Formatted response
   */
  static formatTransactionsListResponse(transactions) {
    return {
      success: true,
      message: 'Transactions retrieved successfully',
      data: {
        transactions: transactions.map(transaction => ({
          id: transaction._id,
          portfolioId: transaction.portfolioId,
          type: transaction.type,
          units: transaction.units,
          nav: transaction.nav,
          amount: transaction.amount,
          date: transaction.date,
          createdAt: transaction.createdAt
        })),
        count: transactions.length
      }
    };
  }

  /**
   * Format empty transactions response
   * @param {string} message - Empty message
   * @returns {Object} Formatted response
   */
  static formatEmptyTransactionsResponse(message = 'No transactions found') {
    return {
      success: true,
      message,
      data: {
        transactions: [],
        count: 0
      }
    };
  }

  /**
   * Format validation error response
   * @param {string} message - Error message
   * @param {Array} errors - Validation errors
   * @returns {Object} Formatted response
   */
  static formatValidationErrorResponse(message, errors) {
    return {
      success: false,
      message,
      errors
    };
  }

  /**
   * Format general error response
   * @param {string} message - Error message
   * @param {string} details - Error details (optional)
   * @returns {Object} Formatted response
   */
  static formatErrorResponse(message, details = null) {
    const response = {
      success: false,
      message
    };

    if (details) {
      response.details = details;
    }

    return response;
  }
}

export default TransactionResponse;
