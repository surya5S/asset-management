using System.Security.Claims;
using AssetManagement.Application.DTOs.Expenses;
using AssetManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssetManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExpensesController : ControllerBase
{
    private readonly IExpenseService _expenseService;

    public ExpensesController(IExpenseService expenseService)
    {
        _expenseService = expenseService;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")!);

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateExpenseDto dto)
    {
        var result = await _expenseService.CreateAsync(GetUserId(), dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpGet]
public async Task<IActionResult> GetAll(
    [FromQuery] int?    year,
    [FromQuery] int?    month,
    [FromQuery] int?    day,
    [FromQuery] string? category)
{
    var result = await _expenseService.GetAllAsync(
        GetUserId(), year, month, day, category);
    return Ok(result);
}

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _expenseService.GetByIdAsync(GetUserId(), id);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateExpenseDto dto)
    {
        var result = await _expenseService.UpdateAsync(GetUserId(), id, dto);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _expenseService.DeleteAsync(GetUserId(), id);
        return NoContent();
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(
        [FromQuery] int year,
        [FromQuery] int? month)
    {
        var result = await _expenseService.GetSummaryAsync(GetUserId(), year, month);
        return Ok(result);
    }
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. [Authorize]                  - Applied at class level — every endpoint in this controller
                                    requires a valid JWT. No token = 401 automatically.
                                    No need to repeat it on every method.
  2. ClaimsPrincipal (User)       - `User` is built into ControllerBase. It's the decoded
                                    JWT — holds all the claims you embedded when generating
                                    the token (sub, email, name etc).
  3. FindFirstValue               - Extracts a specific claim value from the token.
                                    "sub" is the standard JWT subject claim = userId.
  4. GetUserId() helper           - Private method extracts userId from the token once,
                                    reused by every action. Clean and DRY.
  5. CreatedAtAction              - Returns HTTP 201 Created with a Location header pointing
                                    to the new resource URL. Proper REST response for POST.
  6. [FromQuery]                  - Binds URL query parameters (?year=2025&month=3) to
                                    method parameters automatically. No manual parsing.
  7. {id:guid} route constraint   - `:guid` validates the route parameter is a valid GUID
                                    before the action even runs. Invalid IDs get 400 automatically.
  8. NoContent (204)              - Correct HTTP response for DELETE. The resource is gone —
                                    there's nothing to return. 204 = success, no body.
  9. REST Conventions             - POST → Create, GET → Read, PUT → Update, DELETE → Delete.
                                    These HTTP verb mappings are the standard REST contract.
*/