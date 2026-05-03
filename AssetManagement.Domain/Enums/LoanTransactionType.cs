namespace AssetManagement.Domain.Enums;
 
public enum LoanTransactionType
{
    Disbursement = 0,
    Payment = 1
}
 
// WHY THIS ENUM EXISTS:
// A loan account has two kinds of money movement:
//   Disbursement → lender releases money to you (adds to your principal debt)
//   Payment      → you pay money back (reduces your outstanding)
//
// By storing this on every transaction we can replay the full loan history
// and recalculate the outstanding balance from scratch at any point in time.
// This is called "event sourcing" — the transactions ARE the truth,
// not a stored balance number that can drift out of sync.