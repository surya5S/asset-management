namespace AssetManagement.Domain.Enums;

public enum LoanType
{
    Personal  = 0,
    Home      = 1,
    Vehicle   = 2,
    Education = 3,
    Business  = 4,
    Other     = 5
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. Loan categories              - Different loan types have different tax implications,
                                    interest rate ranges, and reporting needs. Keeping them
                                    typed lets you filter, group, and report by loan type.
  2. Explicit integer assignment  - Always assign integers explicitly. Safe against
                                    reordering — existing DB records won't corrupt.
*/