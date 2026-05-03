using AssetManagement.Domain.Entities;
using AssetManagement.Domain.Enums;

namespace AssetManagement.Application.Services;

public class LoanCalculationService
{
    /// <summary>
    /// Calculates the outstanding balance of a loan by replaying all transactions
    /// with monthly compound interest applied from each disbursement date.
    /// Supports mid-tenure interest rate changes — each segment uses its own rate.
    /// </summary>
    public static LoanBalanceResult CalculateOutstanding(Loan loan, DateTime asOfDate)
    {
        var rateSegments = BuildRateSegments(loan.InterestRate, loan.StartDate, loan.RateChanges);

        var transactions = loan.Transactions
            .OrderBy(t => t.Date)
            .ThenBy(t => t.Type) // Disbursements before payments on same day
            .ToList();

        var tranches = new List<Tranche>();
        decimal totalPaid = 0;

        foreach (var tx in transactions)
        {
            if (tx.Type == LoanTransactionType.Disbursement)
                tranches.Add(new Tranche { Principal = tx.Amount, StartDate = tx.Date });
            else
                totalPaid += tx.Amount;
        }

        decimal totalCompounded = 0;
        foreach (var tranche in tranches)
            totalCompounded += CompoundWithRateChanges(tranche.Principal, tranche.StartDate, asOfDate, rateSegments);

        decimal outstanding = Math.Max(0, totalCompounded - totalPaid);
        decimal totalDisbursed = tranches.Sum(t => t.Principal);
        decimal totalInterestAccrued = totalCompounded - totalDisbursed;

        // Payments go to interest first, then principal (standard Indian bank behaviour)
        decimal interestPaid = Math.Min(totalPaid, totalInterestAccrued);
        decimal principalPaid = Math.Max(0, totalPaid - interestPaid);

        return new LoanBalanceResult
        {
            TotalDisbursed = totalDisbursed,
            TotalInterestAccrued = totalInterestAccrued,
            TotalPaid = totalPaid,
            InterestPaid = interestPaid,
            PrincipalPaid = principalPaid,
            OutstandingBalance = outstanding,
            CompletionPercentage = totalCompounded > 0
                ? Math.Round((totalPaid / totalCompounded) * 100, 2)
                : 0
        };
    }

    // ─── RATE-SEGMENT COMPOUNDING ─────────────────────────────────────────────

    /// <summary>
    /// Builds a time-ordered list of (startDate, rate) segments from the original
    /// loan rate plus any recorded rate changes.
    /// </summary>
    private static List<RateSegment> BuildRateSegments(
        decimal originalRate,
        DateTime loanStartDate,
        ICollection<LoanRateChange>? rateChanges)
    {
        var segments = new List<RateSegment>
        {
            new() { StartDate = loanStartDate, Rate = originalRate }
        };

        if (rateChanges is { Count: > 0 })
        {
            foreach (var change in rateChanges.OrderBy(r => r.EffectiveDate))
                segments.Add(new RateSegment { StartDate = change.EffectiveDate, Rate = change.NewRate });
        }

        return segments;
    }

    /// <summary>
    /// Compounds principal from trancheStart to asOfDate, switching rates at each
    /// recorded rate-change boundary. This replaces the single-rate CompoundMonthly
    /// call that was used when every loan had a fixed rate for its entire life.
    ///
    /// Example:
    ///   Segments: [(Jan 2023, 8%), (Jul 2023, 9%)]
    ///   Tranche start: Feb 2023, asOfDate: Jan 2024
    ///   → compound at 8% for Feb–Jun (5 months)
    ///   → compound at 9% for Jul–Dec (6 months)
    /// </summary>
    private static decimal CompoundWithRateChanges(
        decimal principal,
        DateTime trancheStart,
        DateTime asOfDate,
        List<RateSegment> segments)
    {
        if (asOfDate <= trancheStart) return principal;

        // Find the segment whose rate was active at trancheStart
        // (last segment with StartDate <= trancheStart)
        int startIdx = 0;
        for (int i = segments.Count - 1; i >= 0; i--)
        {
            if (segments[i].StartDate <= trancheStart)
            {
                startIdx = i;
                break;
            }
        }

        decimal current = principal;
        DateTime cursor = trancheStart;

        for (int i = startIdx; i < segments.Count; i++)
        {
            // This rate applies until the next change boundary (or asOfDate)
            DateTime periodEnd = (i + 1 < segments.Count && segments[i + 1].StartDate < asOfDate)
                ? segments[i + 1].StartDate
                : asOfDate;

            if (periodEnd > cursor)
            {
                current = CompoundMonthly(current, segments[i].Rate, cursor, periodEnd);
                cursor = periodEnd;
            }

            if (cursor >= asOfDate) break;
        }

        return current;
    }

    // ─── CORE MATH ────────────────────────────────────────────────────────────

    /// <summary>
    /// A = P × (1 + r/12)^months   where r is the annual rate as a decimal.
    /// </summary>
    private static decimal CompoundMonthly(decimal principal, decimal annualRatePercent, DateTime from, DateTime to)
    {
        if (to <= from) return principal;

        double monthsElapsed = GetMonthsElapsed(from, to);
        double monthlyRate = (double)annualRatePercent / 100.0 / 12.0;
        double amount = (double)principal * Math.Pow(1 + monthlyRate, monthsElapsed);
        return Math.Round((decimal)amount, 2);
    }

    private static double GetMonthsElapsed(DateTime from, DateTime to)
    {
        int wholeMonths = ((to.Year - from.Year) * 12) + to.Month - from.Month;
        if (to.Day < from.Day) wholeMonths--;

        DateTime lastWholeMonthDate = from.AddMonths(Math.Max(0, wholeMonths));
        double remainingDays = (to - lastWholeMonthDate).TotalDays;
        double daysInCurrentMonth = DateTime.DaysInMonth(to.Year, to.Month);

        return Math.Max(0, wholeMonths + (remainingDays / daysInCurrentMonth));
    }

    // ─── INNER TYPES ──────────────────────────────────────────────────────────

    private class Tranche
    {
        public decimal Principal { get; set; }
        public DateTime StartDate { get; set; }
    }

    private class RateSegment
    {
        public DateTime StartDate { get; set; }
        public decimal Rate { get; set; }
    }
}

public class LoanBalanceResult
{
    public decimal TotalDisbursed { get; set; }
    public decimal TotalInterestAccrued { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal InterestPaid { get; set; }
    public decimal PrincipalPaid { get; set; }
    public decimal OutstandingBalance { get; set; }
    public decimal CompletionPercentage { get; set; }
}
