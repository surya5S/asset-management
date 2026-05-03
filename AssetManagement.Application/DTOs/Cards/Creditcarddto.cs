namespace AssetManagement.Application.DTOs.Cards;

public class CreateCreditCardDto
{
    public string BankName { get; set; } = string.Empty;
    public string CardName { get; set; } = string.Empty;
    public string LastFourDigits { get; set; } = string.Empty;
    public decimal CreditLimit { get; set; }
    public decimal CurrentBalance { get; set; }
    public decimal InterestRate { get; set; }
    public int BillingCycleDay { get; set; }
    public int DueDateDay { get; set; }
    public string CardColor { get; set; } = "#0284c7";
    public DateTime AprEndDate { get; set; }
}

public class CreditCardDto
{
    public Guid Id { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string CardName { get; set; } = string.Empty;
    public string LastFourDigits { get; set; } = string.Empty;
    public decimal CreditLimit { get; set; }
    public decimal CurrentBalance { get; set; }
    public decimal InterestRate { get; set; }
    public decimal AvailableCredit { get; set; }
    public decimal UtilizationPercentage { get; set; }
    public int BillingCycleDay { get; set; }
    public int DueDateDay { get; set; }
    public DateTime NextDueDate { get; set; }
    public decimal CycleBalance { get; set; }
    public DateTime CycleStartDate { get; set; }
    public DateTime CycleEndDate { get; set; }
    public string CardColor { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime AprEndDate { get; set; }
    public DateTime? LastInterestChargeDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateCardTransactionDto
{
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Category { get; set; } = string.Empty;
    public int Type { get; set; }
    public DateTime Date { get; set; }
    public string? Notes { get; set; }
}

public class CardTransactionDto
{
    public Guid Id { get; set; }
    public Guid CardId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdateCardTransactionDto
{
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Category { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string? Notes { get; set; }
}

public class CardsSummaryDto
{
    public decimal TodaySpend { get; set; }
    public decimal MonthlySpend { get; set; }
    public decimal YearlySpend { get; set; }
    public decimal TotalBalance { get; set; }
    public decimal TotalLimit { get; set; }
    public decimal TotalAvailable { get; set; }
    public decimal OverallUtilization { get; set; }
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. AvailableCredit (computed)   - CreditLimit - CurrentBalance. Calculated in the service,
                                    not stored in DB. Always derived from source values.
  2. UtilizationPercentage        - (CurrentBalance / CreditLimit) * 100. A key credit health
                                    metric. Below 30% is healthy, above 70% hurts credit scores.
                                    Pre-calculated server-side so the UI just renders it.
  3. NextDueDate (computed)       - Calculated from DueDateDay and current date. If due day
                                    is 25 and today is the 10th, next due is the 25th of
                                    this month. If today is the 26th, next due is next month's 25th.
  4. Multiple DTOs in one file    - Related DTOs for the same domain (cards) live together.
                                    Fewer files to navigate, easier to see the full picture.
*/