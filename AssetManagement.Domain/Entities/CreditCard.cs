namespace AssetManagement.Domain.Entities;

public class CreditCard
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string CardName { get; set; } = string.Empty;
    public string LastFourDigits { get; set; } = string.Empty;
    public decimal CreditLimit { get; set; }
    public decimal CurrentBalance { get; set; }
    public decimal InterestRate { get; set; }
    public int BillingCycleDay { get; set; }
    public int DueDateDay { get; set; }
    public string CardColor { get; set; } = "#0284c7";
    public bool IsActive { get; set; } = true;
    public DateTime? LastPaymentDate { get; set; }
    public DateTime AprEndDate { get; set; }
    public DateTime? LastInterestChargeDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public ICollection<CardTransaction> Transactions { get; set; } = new List<CardTransaction>();
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. BillingCycleDay vs DueDateDay - BillingCycleDay = day the statement generates (e.g. 1st).
                                    DueDateDay = day payment is due (e.g. 25th). These are
                                    different — most cards have a grace period between them.
  2. CurrentBalance               - Tracks the running balance. Updated every time a
                                    transaction is added. Avoids recalculating from all
                                    transactions every time you need the balance.
  3. CardColor                    - Hex color stored per card. Lets the UI render each card
                                    with a unique color — visual differentiation when you
                                    have multiple cards.
  4. IsActive soft delete         - Instead of deleting the card (which would orphan
                                    transaction history), mark it inactive. History preserved,
                                    card hidden from active views. Soft delete pattern.
  5. Navigation collections       - `ICollection<CardTransaction>` lets EF Core load all
                                    transactions for a card via Include(). One-to-many.
*/