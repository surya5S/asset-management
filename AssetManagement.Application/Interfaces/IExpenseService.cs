using AssetManagement.Application.DTOs.Expenses;

namespace AssetManagement.Application.Interfaces;

public interface IExpenseService
{
    Task<ExpenseDto> CreateAsync(Guid userId, CreateExpenseDto dto);
    Task<List<ExpenseDto>> GetAllAsync(Guid userId, int? year, int? month, int? day, string? category);
    Task<ExpenseDto> GetByIdAsync(Guid userId, Guid id);
    Task<ExpenseDto> UpdateAsync(Guid userId, Guid id, CreateExpenseDto dto);
    Task DeleteAsync(Guid userId, Guid id);
    Task<ExpenseSummaryDto> GetSummaryAsync(Guid userId, int year, int? month);
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. UserId on Every Method       - Every operation takes a userId. The service always
                                    filters by userId — users can ONLY touch their own data.
                                    This is row-level security enforced in the service layer.
  2. Nullable int? filters        - `int? year, int? month, int? day` — all optional.
                                    Pass year only → yearly view. Pass year + month →
                                    monthly view. Pass all three → daily view.
  3. GetSummaryAsync              - Separate method for aggregated data. Returns totals and
                                    breakdowns — not raw expense rows. Efficient for dashboards.
*/