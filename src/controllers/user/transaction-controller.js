import TransactionRepository from '../../repositories/transaction-repository.js';
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
      const transactions = await TransactionRepository.getUserTransactionHistory(
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

}

export default TransactionController;
