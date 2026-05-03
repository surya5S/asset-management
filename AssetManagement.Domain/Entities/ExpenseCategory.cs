namespace AssetManagement.Domain.Entities;

public class ExpenseCategory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public bool IsDefault { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. User-defined Categories      - Each user can create custom categories (Food, Travel,
                                    Rent etc). Linked to UserId so categories are private.
  2. IsDefault Flag               - Lets you seed default categories (Food, Transport etc)
                                    for new users without hardcoding them in the frontend.
  3. Icon + Color                 - Store icon name (lucide icon string) and hex color.
                                    Keeps the UI flexible — each category has its own look.
*/