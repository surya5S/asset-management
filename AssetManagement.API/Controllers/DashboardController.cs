using AssetManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AssetManagement.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>
    /// GET /api/dashboard/summary?months=1|3|12
    /// months=1  → monthly view (last 1 month of data)
    /// months=3  → quarterly view (last 3 months)
    /// months=12 → yearly view (last 12 months)
    /// </summary>
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] int months = 6)
    {
        // Clamp to valid values only
        if (months != 1 && months != 3 && months != 12) months = 6;
        return Ok(await _dashboardService.GetSummaryAsync(UserId, months));
    }
}

// Register in Program.cs:
// builder.Services.AddScoped<IDashboardService, DashboardService>();