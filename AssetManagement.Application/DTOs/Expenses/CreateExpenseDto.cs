using AssetManagement.Domain.Enums;

namespace AssetManagement.Application.DTOs.Expenses;

public class CreateExpenseDto
{
    public string Title { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Category { get; set; } = string.Empty;
    public PaymentMethod PaymentMethod { get; set; }
    public DateTime Date { get; set; }
    public string? Notes { get; set; }
    public bool IsRecurring { get; set; } = false;
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. Input DTO                    - Only fields the client sends. No Id, UserId, CreatedAt —
                                    those are set server-side. Never let the client dictate
                                    who owns the record (UserId comes from the JWT, not body).
  2. Server-side Ownership        - UserId is extracted from the authenticated JWT token in
                                    the controller — not accepted from the request body.
                                    This is a critical security pattern.
*/