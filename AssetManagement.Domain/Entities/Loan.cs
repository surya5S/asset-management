using AssetManagement.Domain.Enums;

namespace AssetManagement.Domain.Entities;

public class Loan
{
    public int Id { get; set; }
    public Guid UserId { get; set; }

    // --- Identity ---
    public string LoanName { get; set; } = string.Empty;
    public string LenderName { get; set; } = string.Empty;
    public LoanType LoanType { get; set; }

    // --- Sanctioned Terms (set once at loan creation, never change) ---
    public decimal PrincipalAmount { get; set; }       // Total sanctioned amount
    public decimal InterestRate { get; set; }           // Annual rate e.g. 12.5
    public int TenureMonths { get; set; }               // EMI repayment months (excluding buffer)
    public decimal EmiAmount { get; set; }              // Fixed EMI after buffer ends

    // --- Buffer Period ---
    public int BufferPeriodMonths { get; set; }         // How many months of partial interest only
    public decimal PartialInterestAmount { get; set; }  // Fixed monthly amount during buffer (lender defined)
    public DateTime EmiStartDate { get; set; }          // When actual EMI begins

    // --- Dates ---
    public DateTime StartDate { get; set; }             // Loan sanction / first disbursement date
    public DateTime NextDueDate { get; set; }           // Next payment due

    // --- Status ---
    public bool IsActive { get; set; } = true;

    // --- Navigation ---
    public User User { get; set; } = null!;
    public ICollection<LoanTransaction> Transactions { get; set; } = new List<LoanTransaction>();
    public ICollection<LoanRateChange> RateChanges { get; set; } = new List<LoanRateChange>();
}

// WHAT CHANGED FROM THE OLD ENTITY:
// REMOVED:
//   - OutstandingBalance  → no longer stored. Calculated dynamically from transactions.
//   - PaidMonths          → derived from transactions instead.
//   - LoanPayments nav    → replaced by LoanTransactions nav.
//
// ADDED:
//   - BufferPeriodMonths  → how long the interest-only phase lasts
//   - PartialInterestAmount → the fixed monthly amount the lender told you to pay during buffer
//   - EmiStartDate        → exact date EMI kicks in (could be StartDate + BufferPeriodMonths)
//
// WHY REMOVE OUTSTANDING BALANCE:
//   Storing it means you have to update it every time a transaction changes.
//   If a transaction is deleted or edited, the balance can go stale.
//   Calculating it from transactions every time is slower but always correct.
//   For a personal finance app with <1000 transactions per loan, this is fine.