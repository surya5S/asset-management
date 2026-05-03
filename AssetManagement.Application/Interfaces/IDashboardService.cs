using AssetManagement.Application.DTOs;

namespace AssetManagement.Application.Interfaces;

public interface IDashboardService
{
    // months: 1 = monthly, 3 = quarterly, 12 = yearly
    Task<DashboardSummaryDto> GetSummaryAsync(Guid userId, int months);
}