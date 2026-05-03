using AssetManagement.Domain.Enums;

namespace AssetManagement.Application.DTOs;

// ─── CREATE / UPDATE LOAN ────────────────────────────────────────────────────

public class CreateLoanDto
{
    public string LoanName { get; set; } = string.Empty;
    public string LenderName { get; set; } = string.Empty;
    public LoanType LoanType { get; set; }

    public decimal PrincipalAmount { get; set; }     // Total sanctioned
    public decimal InterestRate { get; set; }         // Annual %
    public int TenureMonths { get; set; }             // EMI tenure (excluding buffer)
    public decimal EmiAmount { get; set; }            // Fixed EMI amount

    public int BufferPeriodMonths { get; set; }       // 0 if no buffer
    public decimal PartialInterestAmount { get; set; } // 0 if no buffer
    public DateTime EmiStartDate { get; set; }

    public DateTime StartDate { get; set; }
    public DateTime NextDueDate { get; set; }
}

public class UpdateLoanDto : CreateLoanDto { }

// ─── LOAN RESPONSE ───────────────────────────────────────────────────────────

public class LoanResponseDto
{
    public int Id { get; set; }
    public string LoanName { get; set; } = string.Empty;
    public string LenderName { get; set; } = string.Empty;
    public string LoanType { get; set; } = string.Empty;

    // Sanctioned terms
    public decimal PrincipalAmount { get; set; }
    public decimal InterestRate { get; set; }
    public int TenureMonths { get; set; }
    public decimal EmiAmount { get; set; }

    // Buffer
    public int BufferPeriodMonths { get; set; }
    public decimal PartialInterestAmount { get; set; }
    public DateTime EmiStartDate { get; set; }

    // Dates
    public DateTime StartDate { get; set; }
    public DateTime NextDueDate { get; set; }
    public bool IsActive { get; set; }

    // Calculated fields (from LoanCalculationService)
    public decimal OutstandingBalance { get; set; }
    public decimal TotalDisbursed { get; set; }
    public decimal TotalInterestAccrued { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal InterestPaid { get; set; }
    public decimal PrincipalPaid { get; set; }
    public decimal CompletionPercentage { get; set; }

    // Is loan currently in buffer period?
    public bool IsInBufferPeriod { get; set; }

    // Rate change history — ordered by effective date ascending
    public List<LoanRateChangeResponseDto> RateChanges { get; set; } = [];
}

// ─── LOAN TRANSACTION ────────────────────────────────────────────────────────

public class CreateLoanTransactionDto
{
    public LoanTransactionType Type { get; set; }     // 0 = Disbursement, 1 = Payment
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public PaymentMethod? PaymentMethod { get; set; } // Null for disbursements
    public string? Notes { get; set; }
}

public class LoanTransactionResponseDto
{
    public int Id { get; set; }
    public int LoanId { get; set; }
    public string Type { get; set; } = string.Empty;  // "Disbursement" or "Payment"
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string? PaymentMethod { get; set; }
    public string? Notes { get; set; }
}

// ─── RATE CHANGE ─────────────────────────────────────────────────────────────

public class CreateLoanRateChangeDto
{
    public decimal NewRate { get; set; }        // Annual % e.g. 9.5
    public DateTime EffectiveDate { get; set; }
    public string? Notes { get; set; }
}

public class LoanRateChangeResponseDto
{
    public int Id { get; set; }
    public int LoanId { get; set; }
    public decimal NewRate { get; set; }
    public DateTime EffectiveDate { get; set; }
    public string? Notes { get; set; }
}

// ─── LOAN SUMMARY ────────────────────────────────────────────────────────────

public class LoanSummaryDto
{
    public int TotalLoans { get; set; }
    public int ActiveLoans { get; set; }
    public decimal TotalOutstanding { get; set; }
    public decimal TotalDisbursed { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal MonthlyEmiCommitment { get; set; }   // Sum of EMIs for active loans
    public int LoansInBuffer { get; set; }              // How many are still in buffer phase
}

// WHY TWO SEPARATE RESPONSE DTOS (Loan vs Transaction):
//   The loan list page needs high-level loan info — outstanding balance, progress %.
//   The loan detail page needs the transaction list — amounts, dates, types.
//   Returning transactions inside every loan response would be wasteful on the list page.
//   So loans list = LoanResponseDto (no transactions), detail = same + separate transaction call.
//
// WHY IsInBufferPeriod ON THE RESPONSE:
//   The frontend needs to know this to show the right label —
//   "Buffer Period" vs "EMI Phase" — and display partial interest amount vs EMI amount.
//   Calculating it in C#: DateTime.Now < loan.EmiStartDate