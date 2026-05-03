using AssetManagement.Application.DTOs.Cards;
using AssetManagement.Application.Interfaces;
using AssetManagement.Domain.Entities;
using AssetManagement.Domain.Enums;
using AssetManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AssetManagement.Infrastructure.Services;

public class CreditCardService : ICreditCardService
{
    private readonly AppDbContext _db;

    public CreditCardService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<CreditCardDto>> GetAllCardsAsync(Guid userId)
    {
        var today = DateTime.UtcNow.Date;

        var cards = await _db.CreditCards
            .Where(c => c.UserId == userId && c.IsActive)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        if (cards.Count == 0) return [];

        var cardIds = cards.Select(c => c.Id).ToList();
        var transactions = await _db.CardTransactions
            .Where(t => cardIds.Contains(t.CardId))
            .ToListAsync();

        // Lazily apply interest for any closed cycles that haven't been charged yet
        var newTxns = new List<CardTransaction>();
        foreach (var card in cards)
        {
            var interestTxn = TryCreateInterestTransaction(card, transactions, today);
            if (interestTxn != null)
            {
                newTxns.Add(interestTxn);
                transactions.Add(interestTxn);
                _db.CardTransactions.Add(interestTxn);
            }
        }
        if (newTxns.Count > 0)
            await _db.SaveChangesAsync();

        return cards.Select(c =>
        {
            var cycleStart   = GetEffectiveCycleStart(c.BillingCycleDay, c.DueDateDay, today);
            var cycleEnd     = cycleStart.AddMonths(1);
            var cycleTxns    = transactions.Where(t => t.CardId == c.Id && t.Date >= cycleStart && t.Date < cycleEnd).ToList();
            var cycleBalance = cycleTxns.Where(t => t.Type == LoanTransactionType.Disbursement).Sum(t => t.Amount)
                             - cycleTxns.Where(t => t.Type == LoanTransactionType.Payment).Sum(t => t.Amount);
            return MapToDto(c, Math.Max(0, cycleBalance), cycleStart);
        }).ToList();
    }

    public async Task<CreditCardDto> GetCardByIdAsync(Guid userId, Guid cardId)
    {
        var today = DateTime.UtcNow.Date;

        var card = await _db.CreditCards
            .FirstOrDefaultAsync(c => c.Id == cardId && c.UserId == userId);

        if (card == null)
            throw new KeyNotFoundException("Card not found.");

        var transactions = await _db.CardTransactions
            .Where(t => t.CardId == cardId)
            .ToListAsync();

        var interestTxn = TryCreateInterestTransaction(card, transactions, today);
        if (interestTxn != null)
        {
            transactions.Add(interestTxn);
            _db.CardTransactions.Add(interestTxn);
            await _db.SaveChangesAsync();
        }

        var cycleStart   = GetEffectiveCycleStart(card.BillingCycleDay, card.DueDateDay, today);
        var cycleEnd     = cycleStart.AddMonths(1);
        var cycleTxns    = transactions.Where(t => t.Date >= cycleStart && t.Date < cycleEnd).ToList();
        var cycleBalance = cycleTxns.Where(t => t.Type == LoanTransactionType.Disbursement).Sum(t => t.Amount)
                         - cycleTxns.Where(t => t.Type == LoanTransactionType.Payment).Sum(t => t.Amount);

        return MapToDto(card, Math.Max(0, cycleBalance), cycleStart);
    }

    public async Task<CreditCardDto> CreateCardAsync(
        Guid userId, CreateCreditCardDto dto)
    {
        if (dto.LastFourDigits.Length != 4 || !dto.LastFourDigits.All(char.IsDigit))
            throw new InvalidOperationException("Last four digits must be exactly 4 numbers.");

        if (dto.BillingCycleDay < 1 || dto.BillingCycleDay > 31)
            throw new InvalidOperationException("Billing cycle day must be between 1 and 31.");

        if (dto.DueDateDay < 1 || dto.DueDateDay > 31)
            throw new InvalidOperationException("Due date day must be between 1 and 31.");

        var card = new CreditCard
        {
            UserId          = userId,
            BankName        = dto.BankName.Trim(),
            CardName        = dto.CardName.Trim(),
            LastFourDigits  = dto.LastFourDigits,
            CreditLimit     = dto.CreditLimit,
            CurrentBalance  = dto.CurrentBalance,
            InterestRate    = dto.InterestRate,
            BillingCycleDay = dto.BillingCycleDay,
            DueDateDay      = dto.DueDateDay,
            CardColor       = dto.CardColor,
            AprEndDate      = DateTime.SpecifyKind(dto.AprEndDate.Date, DateTimeKind.Utc),
        };

        _db.CreditCards.Add(card);
        await _db.SaveChangesAsync();
        var createCycleStart = GetCycleStart(card.BillingCycleDay, DateTime.UtcNow.Date);
        return MapToDto(card, 0, createCycleStart);
    }

    public async Task<CreditCardDto> UpdateCardAsync(
        Guid userId, Guid cardId, CreateCreditCardDto dto)
    {
        var card = await _db.CreditCards
            .FirstOrDefaultAsync(c => c.Id == cardId && c.UserId == userId);

        if (card == null)
            throw new KeyNotFoundException("Card not found.");

        card.BankName        = dto.BankName.Trim();
        card.CardName        = dto.CardName.Trim();
        card.CreditLimit     = dto.CreditLimit;
        card.InterestRate    = dto.InterestRate;
        card.BillingCycleDay = dto.BillingCycleDay;
        card.DueDateDay      = dto.DueDateDay;
        card.CardColor       = dto.CardColor;
        card.AprEndDate      = DateTime.SpecifyKind(dto.AprEndDate.Date, DateTimeKind.Utc);
        card.UpdatedAt       = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        var updateCycleStart = GetEffectiveCycleStart(card.BillingCycleDay, card.DueDateDay, DateTime.UtcNow.Date);
        var updateCycleEnd   = updateCycleStart.AddMonths(1);
        var updateCycleTxns  = await _db.CardTransactions
            .Where(t => t.CardId == cardId && t.Date >= updateCycleStart && t.Date < updateCycleEnd)
            .ToListAsync();
        var updateCycleBalance = updateCycleTxns.Where(t => t.Type == LoanTransactionType.Disbursement).Sum(t => t.Amount)
                               - updateCycleTxns.Where(t => t.Type == LoanTransactionType.Payment).Sum(t => t.Amount);
        return MapToDto(card, Math.Max(0, updateCycleBalance), updateCycleStart);
    }

    public async Task DeleteCardAsync(Guid userId, Guid cardId)
    {
        var card = await _db.CreditCards
            .FirstOrDefaultAsync(c => c.Id == cardId && c.UserId == userId);

        if (card == null)
            throw new KeyNotFoundException("Card not found.");

        card.IsActive  = false;
        card.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<List<CardTransactionDto>> GetTransactionsAsync(
        Guid userId, Guid cardId, int? month, int? year)
    {
        var cardExists = await _db.CreditCards
            .AnyAsync(c => c.Id == cardId && c.UserId == userId);

        if (!cardExists)
            throw new KeyNotFoundException("Card not found.");

        var query = _db.CardTransactions
            .Where(t => t.CardId == cardId && t.UserId == userId)
            .AsQueryable();

        if (year.HasValue)
            query = query.Where(t => t.Date.Year == year.Value);

        if (month.HasValue)
            query = query.Where(t => t.Date.Month == month.Value);

        return await query
            .OrderByDescending(t => t.Date)
            .Select(t => MapTransactionToDto(t))
            .ToListAsync();
    }

    public async Task<CardTransactionDto> AddTransactionAsync(
        Guid userId, Guid cardId, CreateCardTransactionDto dto)
    {
        var card = await _db.CreditCards
            .FirstOrDefaultAsync(c => c.Id == cardId && c.UserId == userId);

        if (card == null)
            throw new KeyNotFoundException("Card not found.");

        var transactionType = (LoanTransactionType)dto.Type;

        var transaction = new CardTransaction
        {
            CardId   = cardId,
            UserId   = userId,
            Title    = dto.Title.Trim(),
            Amount   = dto.Amount,
            Category = dto.Category.Trim(),
            Type     = transactionType,
            Date     = DateTime.SpecifyKind(dto.Date.Date, DateTimeKind.Utc),
            Notes    = dto.Notes?.Trim(),
        };

        if (transactionType == LoanTransactionType.Disbursement)
            card.CurrentBalance += dto.Amount;
        else
        {
            card.CurrentBalance -= dto.Amount;
            card.LastPaymentDate = DateTime.UtcNow;
        }

        card.UpdatedAt = DateTime.UtcNow;

        _db.CardTransactions.Add(transaction);
        await _db.SaveChangesAsync();

        return MapTransactionToDto(transaction);
    }

    public async Task<CardTransactionDto> UpdateTransactionAsync(
        Guid userId, Guid cardId, Guid transactionId, UpdateCardTransactionDto dto)
    {
        var transaction = await _db.CardTransactions
            .Include(t => t.Card)
            .FirstOrDefaultAsync(t =>
                t.Id == transactionId &&
                t.CardId == cardId &&
                t.UserId == userId);

        if (transaction == null)
            throw new KeyNotFoundException("Transaction not found.");

        if (transaction.Type == LoanTransactionType.Disbursement)
            transaction.Card.CurrentBalance -= transaction.Amount;
        else
            transaction.Card.CurrentBalance += transaction.Amount;

        transaction.Title    = dto.Title.Trim();
        transaction.Amount   = dto.Amount;
        transaction.Category = dto.Category.Trim();
        transaction.Date     = DateTime.SpecifyKind(dto.Date.Date, DateTimeKind.Utc);
        transaction.Notes    = dto.Notes?.Trim();

        if (transaction.Type == LoanTransactionType.Disbursement)
            transaction.Card.CurrentBalance += dto.Amount;
        else
            transaction.Card.CurrentBalance -= dto.Amount;

        transaction.Card.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return MapTransactionToDto(transaction);
    }

    public async Task<CardsSummaryDto> GetCardsSummaryAsync(Guid userId)
    {
        var today      = DateTime.UtcNow.Date;
        var monthStart = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var yearStart  = new DateTime(today.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var cards = await _db.CreditCards
            .Where(c => c.UserId == userId && c.IsActive)
            .ToListAsync();

        var cardIds = cards.Select(c => c.Id).ToList();

        var debits = await _db.CardTransactions
            .Where(t => t.UserId == userId &&
                        cardIds.Contains(t.CardId) &&
                        t.Type == LoanTransactionType.Disbursement &&
                        t.Date >= yearStart)
            .ToListAsync();

        var totalBalance = cards.Sum(c => c.CurrentBalance);
        var totalLimit   = cards.Sum(c => c.CreditLimit);

        return new CardsSummaryDto
        {
            TodaySpend         = debits.Where(t => t.Date.Date == today).Sum(t => t.Amount),
            MonthlySpend       = debits.Where(t => t.Date >= monthStart).Sum(t => t.Amount),
            YearlySpend        = debits.Sum(t => t.Amount),
            TotalBalance       = totalBalance,
            TotalLimit         = totalLimit,
            TotalAvailable     = totalLimit - totalBalance,
            OverallUtilization = totalLimit > 0
                ? Math.Round(totalBalance / totalLimit * 100, 1) : 0,
        };
    }

    public async Task DeleteTransactionAsync(
        Guid userId, Guid cardId, Guid transactionId)
    {
        var transaction = await _db.CardTransactions
            .Include(t => t.Card)
            .FirstOrDefaultAsync(t =>
                t.Id == transactionId &&
                t.CardId == cardId &&
                t.UserId == userId);

        if (transaction == null)
            throw new KeyNotFoundException("Transaction not found.");

        if (transaction.Type == LoanTransactionType.Disbursement)
            transaction.Card.CurrentBalance -= transaction.Amount;
        else
            transaction.Card.CurrentBalance += transaction.Amount;

        transaction.Card.UpdatedAt = DateTime.UtcNow;

        _db.CardTransactions.Remove(transaction);
        await _db.SaveChangesAsync();
    }

    // Checks whether interest should be charged for the most recently closed billing cycle.
    // Returns a new CardTransaction if interest applies, null otherwise.
    // Side-effects: updates card.CurrentBalance and card.LastInterestChargeDate in memory.
    private static CardTransaction? TryCreateInterestTransaction(
        CreditCard card, List<CardTransaction> allTransactions, DateTime today)
    {
        // No interest after APR end date
        if (today > card.AprEndDate.Date) return null;

        var currentCycleStart = GetCycleStart(card.BillingCycleDay, today);

        // Already charged for this cycle boundary
        if (card.LastInterestChargeDate.HasValue &&
            card.LastInterestChargeDate.Value.Date >= currentCycleStart.Date)
            return null;

        // Previous cycle window (the cycle that just closed)
        var prevMonth     = currentCycleStart.AddMonths(-1);
        var prevDay       = Math.Min(card.BillingCycleDay, DateTime.DaysInMonth(prevMonth.Year, prevMonth.Month));
        var prevCycleStart = DateTime.SpecifyKind(
            new DateTime(prevMonth.Year, prevMonth.Month, prevDay), DateTimeKind.Utc);

        // Respect the grace period: don't charge interest until the due date has passed
        var prevCycleDueDate = CalculateNextDueDate(card.DueDateDay, prevCycleStart);
        if (today.Date < prevCycleDueDate.Date)
            return null;

        var prevTxns = allTransactions
            .Where(t => t.CardId == card.Id && t.Date >= prevCycleStart && t.Date < currentCycleStart)
            .ToList();

        var prevBalance = prevTxns.Where(t => t.Type == LoanTransactionType.Disbursement).Sum(t => t.Amount)
                        - prevTxns.Where(t => t.Type == LoanTransactionType.Payment).Sum(t => t.Amount);

        prevBalance = Math.Max(0, prevBalance);
        if (prevBalance <= 0) return null;

        var interest = Math.Round(prevBalance * (card.InterestRate / 12m / 100m), 2);
        if (interest <= 0) return null;

        card.CurrentBalance         += interest;
        card.LastInterestChargeDate  = currentCycleStart;
        card.UpdatedAt               = DateTime.UtcNow;

        return new CardTransaction
        {
            CardId   = card.Id,
            UserId   = card.UserId,
            Title    = "Interest Charge",
            Amount   = interest,
            Category = "Interest",
            Type     = LoanTransactionType.Disbursement,
            Date     = currentCycleStart,
            Notes    = $"Monthly interest ({card.InterestRate}% APR) on unpaid cycle balance of ${prevBalance:F2}",
        };
    }

    // Returns the start of the current billing cycle for a given BillingCycleDay.
    private static DateTime GetCycleStart(int billingCycleDay, DateTime today)
    {
        var safeDay = Math.Min(billingCycleDay, DateTime.DaysInMonth(today.Year, today.Month));
        var thisMonthStart = DateTime.SpecifyKind(
            new DateTime(today.Year, today.Month, safeDay), DateTimeKind.Utc);

        if (today >= thisMonthStart.Date)
            return thisMonthStart;

        var prev    = today.AddMonths(-1);
        var prevDay = Math.Min(billingCycleDay, DateTime.DaysInMonth(prev.Year, prev.Month));
        return DateTime.SpecifyKind(new DateTime(prev.Year, prev.Month, prevDay), DateTimeKind.Utc);
    }

    // Returns the start of the previous billing cycle relative to a given cycle start.
    private static DateTime GetPrevCycleStart(int billingCycleDay, DateTime cycleStart)
    {
        var prev    = cycleStart.AddMonths(-1);
        var prevDay = Math.Min(billingCycleDay, DateTime.DaysInMonth(prev.Year, prev.Month));
        return DateTime.SpecifyKind(new DateTime(prev.Year, prev.Month, prevDay), DateTimeKind.Utc);
    }

    // Returns the cycle start to use for display/balance purposes.
    // During the grace period (today < due date of the just-closed cycle) we show the
    // closed cycle — that is what the user actually owes. Once the due date passes we
    // advance to the currently-accumulating cycle.
    private static DateTime GetEffectiveCycleStart(int billingCycleDay, int dueDateDay, DateTime today)
    {
        var currentCycleStart = GetCycleStart(billingCycleDay, today);
        var prevCycleStart    = GetPrevCycleStart(billingCycleDay, currentCycleStart);
        var prevCycleDueDate  = CalculateNextDueDate(dueDateDay, prevCycleStart);

        return today.Date < prevCycleDueDate.Date ? prevCycleStart : currentCycleStart;
    }

    // Due date = DueDateDay of the month after the cycle closes (statement month).
    private static DateTime CalculateNextDueDate(int dueDateDay, DateTime cycleStart)
    {
        var statementMonth = cycleStart.AddMonths(1);
        var dueDay  = Math.Min(dueDateDay, DateTime.DaysInMonth(statementMonth.Year, statementMonth.Month));
        var dueDate = DateTime.SpecifyKind(
            new DateTime(statementMonth.Year, statementMonth.Month, dueDay), DateTimeKind.Utc);

        if (dueDate < statementMonth)
            dueDate = dueDate.AddMonths(1);

        return dueDate;
    }

    private static CreditCardDto MapToDto(CreditCard c, decimal cycleBalance, DateTime cycleStart) => new()
    {
        Id                    = c.Id,
        BankName              = c.BankName,
        CardName              = c.CardName,
        LastFourDigits        = c.LastFourDigits,
        CreditLimit           = c.CreditLimit,
        CurrentBalance        = c.CurrentBalance,
        InterestRate          = c.InterestRate,
        AvailableCredit       = c.CreditLimit - c.CurrentBalance,
        UtilizationPercentage = c.CreditLimit > 0
            ? Math.Round(c.CurrentBalance / c.CreditLimit * 100, 1) : 0,
        BillingCycleDay       = c.BillingCycleDay,
        DueDateDay            = c.DueDateDay,
        NextDueDate           = CalculateNextDueDate(c.DueDateDay, cycleStart),
        CycleBalance          = cycleBalance,
        CycleStartDate        = cycleStart,
        CycleEndDate          = cycleStart.AddMonths(1).AddDays(-1),
        CardColor             = c.CardColor,
        IsActive              = c.IsActive,
        AprEndDate            = c.AprEndDate,
        LastInterestChargeDate = c.LastInterestChargeDate,
        CreatedAt             = c.CreatedAt,
    };

    private static CardTransactionDto MapTransactionToDto(CardTransaction t) => new()
    {
        Id        = t.Id,
        CardId    = t.CardId,
        Title     = t.Title,
        Amount    = t.Amount,
        Category  = t.Category,
        Type      = t.Type.ToString(),
        Date      = t.Date,
        Notes     = t.Notes,
        CreatedAt = t.CreatedAt,
    };
}
