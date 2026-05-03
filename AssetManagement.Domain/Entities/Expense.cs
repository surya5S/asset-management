using AssetManagement.Domain.Enums;

namespace AssetManagement.Domain.Entities;

public class Expense
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Category { get; set; } = string.Empty;
    public PaymentMethod PaymentMethod { get; set; }
    public DateTime Date { get; set; }
    public string? Notes { get; set; }
    public bool IsRecurring { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. decimal for Money            - Always use decimal for financial values, never float
                                    or double. Float/double use binary fractions that can't
                                    represent 0.1 exactly — causes rounding errors in money.
                                    decimal is base-10 and precise to 28 significant digits.
  2. Enum Property                - `PaymentMethod` is a strongly typed enum instead of a
                                    raw string. Prevents invalid values like "csh" or "CRAD".
                                    EF Core stores it as an integer in the DB by default.
  3. Nullable string?             - `Notes` is optional — the user may not add a note.
                                    `?` makes it nullable, maps to NULL in PostgreSQL.
  4. bool IsRecurring             - Flag for recurring expenses (subscriptions, rent, EMIs).
                                    Useful later for monthly auto-tracking features.
  5. Navigation Property          - `User User` links back to the owner. EF Core uses this
                                    for JOINs when you query expenses with user data.
*/