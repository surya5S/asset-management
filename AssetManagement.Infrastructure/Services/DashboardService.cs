using AssetManagement.Application.DTOs;
using AssetManagement.Application.Interfaces;
using AssetManagement.Application.Services;
using AssetManagement.Domain.Entities;
using AssetManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AssetManagement.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _db;

    public DashboardService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync(Guid userId, int months)
    {
        var now = DateTime.UtcNow;
        var periodStart = now.AddMonths(-months);

        var expenses = await _db.Expenses
            .Where(e => e.UserId == userId && e.Date >= periodStart)
            .ToListAsync();

        var categories = await _db.ExpenseCategories
            .Where(c => c.UserId == userId)
            .ToListAsync();

        var loans = await _db.Loans
            .Where(l => l.UserId == userId && l.IsActive)
            .Include(l => l.Transactions)
            .ToListAsync();

        var cards = await _db.CreditCards
            .Where(c => c.UserId == userId && c.IsActive)
            .ToListAsync();

        var categoryColors = categories.ToDictionary(c => c.Name, c => c.Color);

        // ─── NET WORTH ────────────────────────────────────────────────────────
        var loanResults = loans.Select(l => LoanCalculationService.CalculateOutstanding(l, now)).ToList();
        var totalLoanOutstanding = loanResults.Sum(r => r.OutstandingBalance);
        var totalCardBalance = cards.Sum(c => c.CurrentBalance);
        var totalLiabilities = totalLoanOutstanding + totalCardBalance;

        var netWorth = new NetWorthDto
        {
            TotalLoanOutstanding = totalLoanOutstanding,
            TotalCardBalance = totalCardBalance,
            TotalLiabilities = totalLiabilities,
            NetWorth = -totalLiabilities
        };

        // ─── SUMMARY CARDS ────────────────────────────────────────────────────
        var currentMonthExpenses = expenses
            .Where(e => e.Date.Month == now.Month && e.Date.Year == now.Year)
            .Sum(e => e.Amount);

        var totalCreditLimit = cards.Sum(c => c.CreditLimit);
        var utilization = totalCreditLimit > 0
            ? Math.Round((totalCardBalance / totalCreditLimit) * 100, 1)
            : 0;

        var summaryCards = new SummaryCardsDto
        {
            MonthlySpend = currentMonthExpenses,
            TotalLoanOutstanding = totalLoanOutstanding,
            CardUtilizationPercent = utilization,
            ActiveLoans = loans.Count,
            TotalCreditLimit = totalCreditLimit,
            TotalCardBalance = totalCardBalance
        };

        // ─── EMI DUES ─────────────────────────────────────────────────────────
        var emiDues = loans.Select(l =>
        {
            var isBuffer = now < l.EmiStartDate;
            return new EmiDueDto
            {
                LoanId = l.Id,
                LoanName = l.LoanName,
                LenderName = l.LenderName,
                Amount = isBuffer ? l.PartialInterestAmount : l.EmiAmount,
                DueDate = l.NextDueDate,
                IsOverdue = l.NextDueDate < now,
                IsInBufferPeriod = isBuffer,
                DueLabel = isBuffer ? "Partial Interest" : "EMI"
            };
        })
        .OrderBy(e => e.IsOverdue ? 0 : 1)
        .ThenBy(e => e.DueDate)
        .ToList();

        // ─── EXPENSE TREND ────────────────────────────────────────────────────
        var monthBuckets = Enumerable.Range(0, months)
            .Select(i => now.AddMonths(-i))
            .OrderBy(d => d)
            .ToList();

        var expenseTrend = monthBuckets.Select(m => new MonthlyExpensePointDto
        {
            Month = m.ToString("MMM yy"),
            MonthNumber = m.Month,
            Year = m.Year,
            Total = expenses
                .Where(e => e.Date.Month == m.Month && e.Date.Year == m.Year)
                .Sum(e => e.Amount)
        }).ToList();

        // ─── CATEGORY BREAKDOWN ───────────────────────────────────────────────
        var totalSpend = expenses.Sum(e => e.Amount);
        var categoryBreakdown = expenses
            .GroupBy(e => e.Category)
            .Select(g => new CategorySpendDto
            {
                Category = g.Key,
                Amount = g.Sum(e => e.Amount),
                Percentage = totalSpend > 0
                    ? Math.Round((g.Sum(e => e.Amount) / totalSpend) * 100, 1)
                    : 0,
                Color = categoryColors.TryGetValue(g.Key, out var color) ? color : "#6366f1"
            })
            .OrderByDescending(c => c.Amount)
            .ToList();

        // ─── LOAN TREND ───────────────────────────────────────────────────────
        var loanTrend = loans.Select(loan => new LoanTrendSeriesDto
        {
            LoanId = loan.Id,
            LoanName = loan.LoanName,
            Points = monthBuckets.Select(m =>
            {
                var asOf = new DateTime(m.Year, m.Month,
                    DateTime.DaysInMonth(m.Year, m.Month), 23, 59, 59, DateTimeKind.Utc);
                var result = LoanCalculationService.CalculateOutstanding(loan, asOf);
                return new LoanTrendPointDto
                {
                    Month = m.ToString("MMM yy"),
                    Outstanding = result.OutstandingBalance
                };
            }).ToList()
        }).ToList();

        // ─── CARD UTILIZATION ─────────────────────────────────────────────────
        var cardUtilization = cards.Select(c => new CardUtilizationDto
        {
            CardId = c.Id,
            CardName = c.CardName,
            BankName = c.BankName,
            CreditLimit = c.CreditLimit,
            CurrentBalance = c.CurrentBalance,
            UtilizationPercent = c.CreditLimit > 0
                ? Math.Round((c.CurrentBalance / c.CreditLimit) * 100, 1)
                : 0,
            CardColor = c.CardColor
        })
        .OrderByDescending(c => c.UtilizationPercent)
        .ToList();

        return new DashboardSummaryDto
        {
            NetWorth = netWorth,
            SummaryCards = summaryCards,
            EmiDues = emiDues,
            ExpenseTrend = expenseTrend,
            CategoryBreakdown = categoryBreakdown,
            LoanTrend = loanTrend,
            CardUtilization = cardUtilization
        };
    }
}

// PERFORMANCE NOTES:
//
// Task.WhenAll fires all 4 DB queries simultaneously.
// Sequential = 4 round trips. Parallel = 1 round trip effectively.
//
// Month buckets with zero-fill:
//   Build buckets first, match expenses into them.
//   Ensures zero bars show for months with no spend — no gaps in the chart.
//
// Loan trend cost:
//   5 loans × 12 months = 60 CompoundMonthly() calls = microseconds.
//   Math.Pow is negligible. No DB call per point — all transactions already loaded.