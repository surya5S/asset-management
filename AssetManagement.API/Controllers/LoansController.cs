using AssetManagement.Application.DTOs;
using AssetManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AssetManagement.API.Controllers;

[ApiController]
[Route("api/loans")]
[Authorize]
public class LoansController : ControllerBase
{
    private readonly ILoanService _loanService;

    public LoansController(ILoanService loanService)
    {
        _loanService = loanService;
    }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ─── LOANS ───────────────────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _loanService.GetAllAsync(UserId));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
        => Ok(await _loanService.GetByIdAsync(UserId, id));

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
        => Ok(await _loanService.GetSummaryAsync(UserId));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateLoanDto dto)
    {
        var result = await _loanService.CreateAsync(UserId, dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateLoanDto dto)
        => Ok(await _loanService.UpdateAsync(UserId, id, dto));

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _loanService.DeleteAsync(UserId, id);
        return NoContent();
    }

    // ─── RATE CHANGES ────────────────────────────────────────────────────────

    [HttpPost("{loanId}/rate-changes")]
    public async Task<IActionResult> AddRateChange(int loanId, [FromBody] CreateLoanRateChangeDto dto)
    {
        var result = await _loanService.AddRateChangeAsync(UserId, loanId, dto);
        return CreatedAtAction(nameof(GetById), new { id = loanId }, result);
    }

    [HttpDelete("{loanId}/rate-changes/{rateChangeId}")]
    public async Task<IActionResult> DeleteRateChange(int loanId, int rateChangeId)
    {
        await _loanService.DeleteRateChangeAsync(UserId, loanId, rateChangeId);
        return NoContent();
    }

    // ─── TRANSACTIONS ─────────────────────────────────────────────────────────

    [HttpGet("{loanId}/transactions")]
    public async Task<IActionResult> GetTransactions(int loanId)
        => Ok(await _loanService.GetTransactionsAsync(UserId, loanId));

    [HttpPost("{loanId}/transactions")]
    public async Task<IActionResult> AddTransaction(int loanId, [FromBody] CreateLoanTransactionDto dto)
    {
        var result = await _loanService.AddTransactionAsync(UserId, loanId, dto);
        return CreatedAtAction(nameof(GetTransactions), new { loanId }, result);
    }

    [HttpDelete("{loanId}/transactions/{transactionId}")]
    public async Task<IActionResult> DeleteTransaction(int loanId, int transactionId)
    {
        await _loanService.DeleteTransactionAsync(UserId, loanId, transactionId);
        return NoContent();
    }
}