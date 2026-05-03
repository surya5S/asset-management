namespace AssetManagement.Domain.Enums;

public enum PaymentMethod
{
    Cash         = 0,
    DebitCard    = 1,
    CreditCard   = 2,
    BankTransfer = 3,
    UPI          = 4,
    Other        = 5
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. Enum                         - A named set of integer constants. Strongly typed —
                                    you can't accidentally pass 99 as a PaymentMethod.
  2. Explicit Integer Values      - Assigning values (= 0, = 1) makes them stable. If you
                                    reorder the enum later, the stored DB integers don't change.
                                    Without explicit values, reordering breaks existing data.
  3. Domain Enums                 - Lives in Domain layer — no dependencies, pure definition.
                                    Both Application and Infrastructure can reference it freely.
*/