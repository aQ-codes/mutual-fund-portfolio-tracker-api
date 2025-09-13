import PortfolioService from '../../services/portfolio-service.js';
import TransactionRequest from '../../requests/user/transaction-request.js';
import TransactionResponse from '../../responses/user/transaction-response.js';
import CustomValidationError from '../../exceptions/custom-validation-error.js';

class TransactionController {
  // GET /api/transactions - Get user's transaction history
  static async getTransactions(req, res) {
    try {
      const userId = req.user.id;
      const { schemeCode, page = 1, limit = 50, type } = req.query;

      // Validate query parameters
      const validatedQuery = TransactionRequest.validateTransactionQuery({
        schemeCode: schemeCode ? parseInt(schemeCode) : null,
        page: parseInt(page),
        limit: parseInt(limit),
        type
      });

      if (!validatedQuery.isValid) {
        throw new CustomValidationError('Invalid query parameters', validatedQuery.errors);
      }

      // Get transaction history
      const transactions = await PortfolioService.getTransactionHistory(
        userId, 
        validatedQuery.data.schemeCode,
        {
          page: validatedQuery.data.page,
          limit: validatedQuery.data.limit
        }
      );

      if (!transactions || transactions.length === 0) {
        return res.status(200).json(
          TransactionResponse.formatEmptyTransactionsResponse('No transactions found')
        );
      }

      res.status(200).json(
        TransactionResponse.formatTransactionsListResponse(transactions)
      );

    } catch (error) {
      console.error('Get transactions error:', error);
      
      if (error instanceof CustomValidationError) {
        return res.status(400).json(
          TransactionResponse.formatValidationErrorResponse('Invalid request parameters', error.errors)
        );
      }
      
      res.status(500).json(
        TransactionResponse.formatErrorResponse('Failed to fetch transactions. Please try again.')
      );
    }
  }

  // POST /api/transactions/rebuild-holdings - Rebuild holdings from transactions
  static async rebuildHoldings(req, res) {
    try {
      const userId = req.user.id;
      const { schemeCode } = req.body;

      // Validate request
      if (schemeCode && typeof schemeCode !== 'number') {
        throw new CustomValidationError('Invalid scheme code', ['Scheme code must be a number']);
      }

      // Rebuild holdings
      await PortfolioService.rebuildHoldings(userId, schemeCode);

      res.status(200).json({
        success: true,
        message: 'Holdings rebuilt successfully from transaction history'
      });

    } catch (error) {
      console.error('Rebuild holdings error:', error);
      
      if (error instanceof CustomValidationError) {
        return res.status(400).json(
          TransactionResponse.formatValidationErrorResponse('Invalid request data', error.errors)
        );
      }
      
      res.status(500).json(
        TransactionResponse.formatErrorResponse('Failed to rebuild holdings. Please try again.')
      );
    }
  }
}

export default TransactionController;
