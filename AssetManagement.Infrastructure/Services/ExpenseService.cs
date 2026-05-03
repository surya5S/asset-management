using AssetManagement.Application.DTOs.Expenses;
using AssetManagement.Application.Interfaces;
using AssetManagement.Domain.Entities;
using AssetManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AssetManagement.Infrastructure.Services;

public class ExpenseService : IExpenseService
{
    private readonly AppDbContext _db;

    public ExpenseService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ExpenseDto> CreateAsync(Guid userId, CreateExpenseDto dto)
    {
        var expense = new Expense
        {
            UserId        = userId,
            Title         = dto.Title.Trim(),
            Amount        = dto.Amount,
            Category      = dto.Category.Trim(),
            PaymentMethod = dto.PaymentMethod,
            Date          = DateTime.SpecifyKind(dto.Date.Date, DateTimeKind.Utc),
            Notes         = dto.Notes?.Trim(),
            IsRecurring   = dto.IsRecurring,
        };

        _db.Expenses.Add(expense);
        await _db.SaveChangesAsync();
        return MapToDto(expense);
    }

  public async Task<List<ExpenseDto>> GetAllAsync(
    Guid userId, int? year, int? month, int? day, string? category)
{
    var query = _db.Expenses
        .Where(e => e.UserId == userId)
        .AsQueryable();

    if (year.HasValue)
        query = query.Where(e => e.Date.Year == year.Value);

    if (month.HasValue)
        query = query.Where(e => e.Date.Month == month.Value);

    if (day.HasValue)
        query = query.Where(e => e.Date.Day == day.Value);

    if (!string.IsNullOrWhiteSpace(category))
        query = query.Where(e => e.Category == category);

    return await query
        .OrderByDescending(e => e.Date)
        .Select(e => MapToDto(e))
        .ToListAsync();
}


    public async Task<ExpenseDto> GetByIdAsync(Guid userId, Guid id)
    {
        var expense = await _db.Expenses
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);

        if (expense == null)
            throw new KeyNotFoundException("Expense not found.");

        return MapToDto(expense);
    }

    public async Task<ExpenseDto> UpdateAsync(
        Guid userId, Guid id, CreateExpenseDto dto)
    {
        var expense = await _db.Expenses
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);

        if (expense == null)
            throw new KeyNotFoundException("Expense not found.");

        expense.Title         = dto.Title.Trim();
        expense.Amount        = dto.Amount;
        expense.Category      = dto.Category.Trim();
        expense.PaymentMethod = dto.PaymentMethod;
        expense.Date          = DateTime.SpecifyKind(dto.Date.Date, DateTimeKind.Utc);
        expense.Notes         = dto.Notes?.Trim();
        expense.IsRecurring   = dto.IsRecurring;
        expense.UpdatedAt     = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return MapToDto(expense);
    }

    public async Task DeleteAsync(Guid userId, Guid id)
    {
        var expense = await _db.Expenses
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);

        if (expense == null)
            throw new KeyNotFoundException("Expense not found.");

        _db.Expenses.Remove(expense);
        await _db.SaveChangesAsync();
    }

    public async Task<ExpenseSummaryDto> GetSummaryAsync(
        Guid userId, int year, int? month)
    {
        var query = _db.Expenses
            .Where(e => e.UserId == userId && e.Date.Year == year);

        if (month.HasValue)
            query = query.Where(e => e.Date.Month == month.Value);

        var expenses = await query.ToListAsync();

        if (!expenses.Any())
            return new ExpenseSummaryDto();

        var total    = expenses.Sum(e => e.Amount);
        var days     = month.HasValue
            ? DateTime.DaysInMonth(year, month.Value)
            : 365;

        var byCategory = expenses
            .GroupBy(e => e.Category)
            .Select(g => new CategoryBreakdownDto
            {
                Category   = g.Key,
                Amount     = g.Sum(e => e.Amount),
                Count      = g.Count(),
                Percentage = Math.Round(g.Sum(e => e.Amount) / total * 100, 1)
            })
            .OrderByDescending(c => c.Amount)
            .ToList();

        return new ExpenseSummaryDto
        {
            TotalAmount  = total,
            TotalCount   = expenses.Count,
            DailyAverage = Math.Round(total / days, 2),
            ByCategory   = byCategory,
        };
    }

    private static ExpenseDto MapToDto(Expense e) => new()
    {
        Id            = e.Id,
        Title         = e.Title,
        Amount        = e.Amount,
        Category      = e.Category,
        PaymentMethod = e.PaymentMethod.ToString(),
        Date          = e.Date,
        Notes         = e.Notes,
        IsRecurring   = e.IsRecurring,
        CreatedAt     = e.CreatedAt,
    };
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. AsQueryable()                - Returns an IQueryable that hasn't executed yet.
                                    You can keep chaining .Where() conditions and EF
                                    builds ONE SQL query — not multiple round trips.
  2. Deferred Execution           - LINQ queries don't hit the DB until .ToListAsync(),
                                    .FirstOrDefaultAsync() etc. Every .Where() just
                                    adds to the SQL WHERE clause — nothing runs early.
  3. HasValue on Nullable         - `if (year.HasValue)` checks if the nullable int has
                                    a value before using it. Same as `if (year != null)`.
  4. .Date property               - `dto.Date.Date` strips the time component. Stores
                                    just the date part — no accidental timezone drift
                                    from time components being stored.
  5. Double userId filter         - `e.Id == id && e.UserId == userId` — both conditions
                                    required. Even if someone guesses another user's expense
                                    ID, the userId check blocks the access. Horizontal
                                    access control at the data layer.
  6. GroupBy + Select (LINQ)      - Groups expenses by category in memory, then projects
                                    each group into a CategoryBreakdownDto. Equivalent to
                                    SQL GROUP BY with SUM and COUNT aggregates.
  7. Math.Round                   - Rounds the percentage to 1 decimal and daily average
                                    to 2. Never send raw float math results to the UI.
  8. Static MapToDto              - Private static helper converts Entity → DTO.
                                    `static` because it doesn't need instance state.
                                    Centralizes the mapping — change it in one place.
  9. .ToString() on Enum          - Converts `PaymentMethod.CreditCard` to the string
                                    "CreditCard". The DTO exposes strings, not enum ints.
  10. expenses.Any()              - Checks if the list has items before dividing (avoids
                                    divide-by-zero on total). Returns empty summary if no data.
*/

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. IsNullOrWhiteSpace           - Safer than IsNullOrEmpty. Catches null, "", and "   "
                                    (spaces only). A category of whitespace should not
                                    filter — treat it as unset.
  2. String equality filter       - EF Core translates `e.Category == category` into a
                                    SQL WHERE Category = @category. Case-sensitive by default
                                    in PostgreSQL — categories are stored consistently so
                                    this is fine. If you add free-text categories later,
                                    switch to EF.Functions.ILike for case-insensitive match.
*/