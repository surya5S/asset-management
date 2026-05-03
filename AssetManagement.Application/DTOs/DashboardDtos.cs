namespace AssetManagement.Application.DTOs;

// ─── MAIN DASHBOARD RESPONSE ─────────────────────────────────────────────────

public class DashboardSummaryDto
{
    public NetWorthDto NetWorth { get; set; } = new();
    public SummaryCardsDto SummaryCards { get; set; } = new();
    public List<EmiDueDto> EmiDues { get; set; } = new();
    public List<MonthlyExpensePointDto> ExpenseTrend { get; set; } = new();
    public List<CategorySpendDto> CategoryBreakdown { get; set; } = new();
    public List<LoanTrendSeriesDto> LoanTrend { get; set; } = new();
    public List<CardUtilizationDto> CardUtilization { get; set; } = new();
}

// ─── NET WORTH ────────────────────────────────────────────────────────────────

public class NetWorthDto
{
    public decimal TotalLoanOutstanding { get; set; }
    public decimal TotalCardBalance { get; set; }
    public decimal TotalLiabilities { get; set; }
    public decimal NetWorth { get; set; }            // 0 - liabilities until Phase 6 adds assets
}

// ─── SUMMARY CARDS ────────────────────────────────────────────────────────────

public class SummaryCardsDto
{
    public decimal MonthlySpend { get; set; }
    public decimal TotalLoanOutstanding { get; set; }
    public decimal CardUtilizationPercent { get; set; }
    public int ActiveLoans { get; set; }
    public decimal TotalCreditLimit { get; set; }
    public decimal TotalCardBalance { get; set; }
}

// ─── EMI DUES ─────────────────────────────────────────────────────────────────

public class EmiDueDto
{
    public int LoanId { get; set; }
    public string LoanName { get; set; } = string.Empty;
    public string LenderName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
    public bool IsOverdue { get; set; }
    public bool IsInBufferPeriod { get; set; }
    public string DueLabel { get; set; } = string.Empty; // "EMI" or "Partial Interest"
}

// ─── EXPENSE TREND ────────────────────────────────────────────────────────────

public class MonthlyExpensePointDto
{
    public string Month { get; set; } = string.Empty;  // "Jan 25"
    public decimal Total { get; set; }
    public int Year { get; set; }
    public int MonthNumber { get; set; }
}

// ─── CATEGORY BREAKDOWN ───────────────────────────────────────────────────────

public class CategorySpendDto
{
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Percentage { get; set; }
    public string Color { get; set; } = string.Empty;
}

// ─── LOAN TREND ───────────────────────────────────────────────────────────────

public class LoanTrendSeriesDto
{
    public int LoanId { get; set; }
    public string LoanName { get; set; } = string.Empty;
    public List<LoanTrendPointDto> Points { get; set; } = new();
}

public class LoanTrendPointDto
{
    public string Month { get; set; } = string.Empty;
    public decimal Outstanding { get; set; }
}

// ─── CARD UTILIZATION ─────────────────────────────────────────────────────────

public class CardUtilizationDto
{
    public Guid CardId { get; set; }
    public string CardName { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public decimal CreditLimit { get; set; }
    public decimal CurrentBalance { get; set; }
    public decimal UtilizationPercent { get; set; }
    public string CardColor { get; set; } = string.Empty;
}

// WHY ONE BIG DashboardSummaryDto:
//   Dashboard needs all data at once. Multiple endpoints = loading waterfalls.
//   One request, everything arrives together. Cached per period in React Query.
//
// WHY LOAN TREND IS CALCULATED NOT STORED:
//   We replay transactions month by month using LoanCalculationService.
//   Historically accurate even if old transactions are edited later.