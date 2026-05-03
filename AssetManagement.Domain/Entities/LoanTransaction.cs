using AssetManagement.Domain.Enums;

namespace AssetManagement.Domain.Entities;

public class LoanTransaction
{
    public int Id { get; set; }
    public int LoanId { get; set; }
    public Guid UserId { get; set; }

    public LoanTransactionType Type { get; set; }   // Disbursement or Payment
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public PaymentMethod? PaymentMethod { get; set; } // Null for disbursements
    public string? Notes { get; set; }

    // --- Navigation ---
    public Loan Loan { get; set; } = null!;
    public User User { get; set; } = null!;
}

// WHY PaymentMethod IS NULLABLE:
//   A disbursement is money FROM the lender TO you — there's no "how you paid"
//   because you didn't pay anything. It only makes sense on Payment type.
//   Making it nullable lets us use one table for both transaction types
//   instead of splitting into two tables (which would complicate queries).
//
// WHY NO PrincipalComponent / InterestComponent COLUMNS:
//   Old loan_payments stored the P&I split as fixed numbers.
//   That was pre-calculated and stored, which means it's wrong the moment
//   you add an earlier transaction (the split changes retroactively).
//   Now we calculate P&I split dynamically in the service layer
//   based on the full transaction timeline. Always accurate.