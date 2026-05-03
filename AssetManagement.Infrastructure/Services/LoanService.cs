using AssetManagement.Application.DTOs;
using AssetManagement.Application.Interfaces;
using AssetManagement.Application.Services;
using AssetManagement.Domain.Entities;
using AssetManagement.Domain.Enums;
using AssetManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AssetManagement.Infrastructure.Services;

public class LoanService : ILoanService
{
    private readonly AppDbContext _db;

    public LoanService(AppDbContext db)
    {
        _db = db;
    }

    // ─── LOANS CRUD ──────────────────────────────────────────────────────────

    public async Task<List<LoanResponseDto>> GetAllAsync(Guid userId)
    {
        var loans = await _db.Loans
            .Where(l => l.UserId == userId && l.IsActive)
            .Include(l => l.Transactions)
            .Include(l => l.RateChanges)
            .OrderByDescending(l => l.StartDate)
            .ToListAsync();

        return loans.Select(l => MapToResponse(l)).ToList();
    }

    public async Task<LoanResponseDto> GetByIdAsync(Guid userId, int loanId)
    {
        var loan = await _db.Loans
            .Include(l => l.Transactions)
            .Include(l => l.RateChanges)
            .FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId && l.IsActive)
            ?? throw new KeyNotFoundException("Loan not found.");

        return MapToResponse(loan);
    }

    public async Task<LoanResponseDto> CreateAsync(Guid userId, CreateLoanDto dto)
    {
        var loan = new Loan
        {
            UserId = userId,
            LoanName = dto.LoanName,
            LenderName = dto.LenderName,
            LoanType = dto.LoanType,
            PrincipalAmount = dto.PrincipalAmount,
            InterestRate = dto.InterestRate,
            TenureMonths = dto.TenureMonths,
            EmiAmount = dto.EmiAmount,
            BufferPeriodMonths = dto.BufferPeriodMonths,
            PartialInterestAmount = dto.PartialInterestAmount,
            EmiStartDate = DateTime.SpecifyKind(dto.EmiStartDate, DateTimeKind.Utc),
            StartDate = DateTime.SpecifyKind(dto.StartDate, DateTimeKind.Utc),
            NextDueDate = DateTime.SpecifyKind(dto.NextDueDate, DateTimeKind.Utc),
            IsActive = true
        };

        _db.Loans.Add(loan);
        await _db.SaveChangesAsync();
        return MapToResponse(loan);
    }

    public async Task<LoanResponseDto> UpdateAsync(Guid userId, int loanId, UpdateLoanDto dto)
    {
        var loan = await _db.Loans
            .Include(l => l.Transactions)
            .Include(l => l.RateChanges)
            .FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId && l.IsActive)
            ?? throw new KeyNotFoundException("Loan not found.");

        loan.LoanName = dto.LoanName;
        loan.LenderName = dto.LenderName;
        loan.LoanType = dto.LoanType;
        loan.PrincipalAmount = dto.PrincipalAmount;
        loan.InterestRate = dto.InterestRate;
        loan.TenureMonths = dto.TenureMonths;
        loan.EmiAmount = dto.EmiAmount;
        loan.BufferPeriodMonths = dto.BufferPeriodMonths;
        loan.PartialInterestAmount = dto.PartialInterestAmount;
        loan.EmiStartDate = DateTime.SpecifyKind(dto.EmiStartDate, DateTimeKind.Utc);
        loan.StartDate = DateTime.SpecifyKind(dto.StartDate, DateTimeKind.Utc);
        loan.NextDueDate = DateTime.SpecifyKind(dto.NextDueDate, DateTimeKind.Utc);

        await _db.SaveChangesAsync();
        return MapToResponse(loan);
    }

    public async Task DeleteAsync(Guid userId, int loanId)
    {
        var loan = await _db.Loans
            .FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId)
            ?? throw new KeyNotFoundException("Loan not found.");

        loan.IsActive = false; // Soft delete — preserves transaction history
        await _db.SaveChangesAsync();
    }

    // ─── TRANSACTIONS ─────────────────────────────────────────────────────────

    public async Task<List<LoanTransactionResponseDto>> GetTransactionsAsync(Guid userId, int loanId)
    {
        var loan = await _db.Loans
            .FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId && l.IsActive)
            ?? throw new KeyNotFoundException("Loan not found.");

        var transactions = await _db.LoanTransactions
            .Where(t => t.LoanId == loanId && t.UserId == userId)
            .OrderByDescending(t => t.Date)
            .ToListAsync();

        return transactions.Select(MapTransactionToResponse).ToList();
    }

    public async Task<LoanTransactionResponseDto> AddTransactionAsync(Guid userId, int loanId, CreateLoanTransactionDto dto)
    {
        var loan = await _db.Loans
            .FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId && l.IsActive)
            ?? throw new KeyNotFoundException("Loan not found.");

        // Disbursements shouldn't have a payment method
        if (dto.Type == LoanTransactionType.Disbursement && dto.PaymentMethod.HasValue)
            throw new InvalidOperationException("Disbursements don't have a payment method.");

        // Payments must have a payment method
        if (dto.Type == LoanTransactionType.Payment && !dto.PaymentMethod.HasValue)
            throw new InvalidOperationException("Payments require a payment method.");

        var transaction = new LoanTransaction
        {
            LoanId = loanId,
            UserId = userId,
            Type = dto.Type,
            Amount = dto.Amount,
            Date = DateTime.SpecifyKind(dto.Date, DateTimeKind.Utc),
            PaymentMethod = dto.PaymentMethod,
            Notes = dto.Notes
        };

        _db.LoanTransactions.Add(transaction);
        await _db.SaveChangesAsync();

        return MapTransactionToResponse(transaction);
    }

    public async Task DeleteTransactionAsync(Guid userId, int loanId, int transactionId)
    {
        var transaction = await _db.LoanTransactions
            .FirstOrDefaultAsync(t => t.Id == transactionId && t.LoanId == loanId && t.UserId == userId)
            ?? throw new KeyNotFoundException("Transaction not found.");

        // No soft delete here — transaction history accuracy is more important than keeping it.
        // Deleting a transaction means the balance recalculates automatically on next fetch.
        _db.LoanTransactions.Remove(transaction);
        await _db.SaveChangesAsync();
    }

    // ─── RATE CHANGES ────────────────────────────────────────────────────────

    public async Task<LoanRateChangeResponseDto> AddRateChangeAsync(Guid userId, int loanId, CreateLoanRateChangeDto dto)
    {
        var loan = await _db.Loans
            .Include(l => l.Transactions)
            .Include(l => l.RateChanges)
            .FirstOrDefaultAsync(l => l.Id == loanId && l.UserId == userId && l.IsActive)
            ?? throw new KeyNotFoundException("Loan not found.");

        var rateChange = new LoanRateChange
        {
            LoanId = loanId,
            UserId = userId,
            NewRate = dto.NewRate,
            EffectiveDate = DateTime.SpecifyKind(dto.EffectiveDate, DateTimeKind.Utc),
            Notes = dto.Notes
        };

        _db.LoanRateChanges.Add(rateChange);
        await _db.SaveChangesAsync();

        return MapRateChangeToResponse(rateChange);
    }

    public async Task DeleteRateChangeAsync(Guid userId, int loanId, int rateChangeId)
    {
        var rateChange = await _db.LoanRateChanges
            .FirstOrDefaultAsync(r => r.Id == rateChangeId && r.LoanId == loanId && r.UserId == userId)
            ?? throw new KeyNotFoundException("Rate change not found.");

        _db.LoanRateChanges.Remove(rateChange);
        await _db.SaveChangesAsync();
    }

    // ─── SUMMARY ─────────────────────────────────────────────────────────────

    public async Task<LoanSummaryDto> GetSummaryAsync(Guid userId)
    {
        var loans = await _db.Loans
            .Where(l => l.UserId == userId && l.IsActive)
            .Include(l => l.Transactions)
            .Include(l => l.RateChanges)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var results = loans.Select(l => new
        {
            Loan = l,
            Balance = LoanCalculationService.CalculateOutstanding(l, now)
        }).ToList();

        return new LoanSummaryDto
        {
            TotalLoans = loans.Count,
            ActiveLoans = loans.Count,
            TotalDisbursed = results.Sum(r => r.Balance.TotalDisbursed),
            TotalOutstanding = results.Sum(r => r.Balance.OutstandingBalance),
            TotalPaid = results.Sum(r => r.Balance.TotalPaid),
            MonthlyEmiCommitment = loans.Sum(l => l.EmiAmount),
            LoansInBuffer = loans.Count(l => now < l.EmiStartDate)
        };
    }

    // ─── MAPPING ─────────────────────────────────────────────────────────────

    private LoanResponseDto MapToResponse(Loan loan)
    {
        var now = DateTime.UtcNow;
        var balance = LoanCalculationService.CalculateOutstanding(loan, now);

        return new LoanResponseDto
        {
            Id = loan.Id,
            LoanName = loan.LoanName,
            LenderName = loan.LenderName,
            LoanType = loan.LoanType.ToString(),
            PrincipalAmount = loan.PrincipalAmount,
            InterestRate = loan.InterestRate,
            TenureMonths = loan.TenureMonths,
            EmiAmount = loan.EmiAmount,
            BufferPeriodMonths = loan.BufferPeriodMonths,
            PartialInterestAmount = loan.PartialInterestAmount,
            EmiStartDate = loan.EmiStartDate,
            StartDate = loan.StartDate,
            NextDueDate = loan.NextDueDate,
            IsActive = loan.IsActive,

            // All calculated — never stored
            OutstandingBalance = balance.OutstandingBalance,
            TotalDisbursed = balance.TotalDisbursed,
            TotalInterestAccrued = balance.TotalInterestAccrued,
            TotalPaid = balance.TotalPaid,
            InterestPaid = balance.InterestPaid,
            PrincipalPaid = balance.PrincipalPaid,
            CompletionPercentage = balance.CompletionPercentage,
            IsInBufferPeriod = now < loan.EmiStartDate,
            RateChanges = loan.RateChanges
                .OrderBy(r => r.EffectiveDate)
                .Select(MapRateChangeToResponse)
                .ToList()
        };
    }

    private static LoanRateChangeResponseDto MapRateChangeToResponse(LoanRateChange r) =>
        new()
        {
            Id = r.Id,
            LoanId = r.LoanId,
            NewRate = r.NewRate,
            EffectiveDate = r.EffectiveDate,
            Notes = r.Notes
        };

    private LoanTransactionResponseDto MapTransactionToResponse(LoanTransaction t)
    {
        return new LoanTransactionResponseDto
        {
            Id = t.Id,
            LoanId = t.LoanId,
            Type = t.Type.ToString(),
            Amount = t.Amount,
            Date = t.Date,
            PaymentMethod = t.PaymentMethod?.ToString(),
            Notes = t.Notes
        };
    }
}

// WHY LoanCalculationService IS INJECTED (not just static methods):
//   Injecting it makes it testable. You can mock the calculator in unit tests
//   without needing a real database. Static methods can't be mocked.
//
// WHY HARD DELETE FOR TRANSACTIONS (not soft delete):
//   Loans themselves are soft-deleted to preserve history.
//   But a transaction deletion is intentional — the user made a mistake.
//   If we soft-deleted transactions, the balance would still include them
//   unless we filtered them out everywhere. Hard delete keeps the balance
//   recalculation simple: just sum all rows in the table.
//
// WHY INCLUDE TRANSACTIONS ON EVERY LOAN FETCH:
//   The balance calculation needs all transactions to work.
//   We can't calculate outstanding without loading the transaction history.
//   EF Core's Include() loads them in one SQL JOIN — not N+1 queries.