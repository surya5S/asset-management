
using AssetManagement.Domain.Enums;

namespace AssetManagement.Domain.Entities;


public class CardTransaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CardId { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Category { get; set; } = string.Empty;
    public LoanTransactionType Type { get; set; }
    public DateTime Date { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public CreditCard Card { get; set; } = null!;
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. TransactionType enum         - Debit (purchase) vs Credit (payment/refund). Critical
                                    for correct balance calculation — debits increase the
                                    balance, credits decrease it.
  2. Both CardId and UserId       - CardId links to the card. UserId is denormalized here
                                    for security — every query filters by UserId so a user
                                    can never access another user's transactions even if
                                    they guess a CardId.
  3. Denormalization              - Storing UserId directly on the transaction (even though
                                    you could join through Card to get it) is a deliberate
                                    trade-off. Faster queries, simpler security filters.
*/