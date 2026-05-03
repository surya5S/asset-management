using AssetManagement.Domain.Enums;

namespace AssetManagement.Application.DTOs.Expenses;

public class ExpenseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Category { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string? Notes { get; set; }
    public bool IsRecurring { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ExpenseSummaryDto
{
    public decimal TotalAmount { get; set; }
    public int TotalCount { get; set; }
    public decimal DailyAverage { get; set; }
    public List<CategoryBreakdownDto> ByCategory { get; set; } = new();
}

public class CategoryBreakdownDto
{
    public string Category { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. Response DTO vs Entity       - ExpenseDto is what the API returns. PaymentMethod is
                                    a string here (not enum) so the client gets "CreditCard"
                                    not the integer 2. Friendlier for the frontend.
  2. Summary DTO                  - ExpenseSummaryDto aggregates data for the dashboard.
                                    Calculated server-side — less data over the wire than
                                    sending all records and computing in the browser.
  3. CategoryBreakdownDto         - Nested DTO for the pie chart data. Percentage is pre-
                                    calculated on the server so React just renders it.
  4. List<T> initialization       - `= new()` initializes the list — no null reference
                                    if no categories exist. The `new()` target-typed expression
                                    infers the type from the property declaration.
*/