using AssetManagement.Application.DTOs;

namespace AssetManagement.Application.Interfaces;

public interface ILoanService
{
    // Loans
    Task<List<LoanResponseDto>> GetAllAsync(Guid userId);
    Task<LoanResponseDto> GetByIdAsync(Guid userId, int loanId);
    Task<LoanResponseDto> CreateAsync(Guid userId, CreateLoanDto dto);
    Task<LoanResponseDto> UpdateAsync(Guid userId, int loanId, UpdateLoanDto dto);
    Task DeleteAsync(Guid userId, int loanId);

    // Transactions
    Task<List<LoanTransactionResponseDto>> GetTransactionsAsync(Guid userId, int loanId);
    Task<LoanTransactionResponseDto> AddTransactionAsync(Guid userId, int loanId, CreateLoanTransactionDto dto);
    Task DeleteTransactionAsync(Guid userId, int loanId, int transactionId);

    // Rate changes
    Task<LoanRateChangeResponseDto> AddRateChangeAsync(Guid userId, int loanId, CreateLoanRateChangeDto dto);
    Task DeleteRateChangeAsync(Guid userId, int loanId, int rateChangeId);

    // Summary
    Task<LoanSummaryDto> GetSummaryAsync(Guid userId);
}