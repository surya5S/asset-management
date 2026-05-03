using System.Security.Claims;
using AssetManagement.Application.DTOs.Cards;
using AssetManagement.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssetManagement.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CreditCardsController : ControllerBase
{
    private readonly ICreditCardService _cardService;

    public CreditCardsController(ICreditCardService cardService)
    {
        _cardService = cardService;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")!);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _cardService.GetAllCardsAsync(GetUserId());
        return Ok(result);
    }

    [HttpGet("{cardId:guid}")]
    public async Task<IActionResult> GetById(Guid cardId)
    {
        var result = await _cardService.GetCardByIdAsync(GetUserId(), cardId);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCreditCardDto dto)
    {
        var result = await _cardService.CreateCardAsync(GetUserId(), dto);
        return CreatedAtAction(nameof(GetById), new { cardId = result.Id }, result);
    }

    [HttpPut("{cardId:guid}")]
    public async Task<IActionResult> Update(
        Guid cardId, [FromBody] CreateCreditCardDto dto)
    {
        var result = await _cardService.UpdateCardAsync(GetUserId(), cardId, dto);
        return Ok(result);
    }

    [HttpDelete("{cardId:guid}")]
    public async Task<IActionResult> Delete(Guid cardId)
    {
        await _cardService.DeleteCardAsync(GetUserId(), cardId);
        return NoContent();
    }

    [HttpGet("{cardId:guid}/transactions")]
    public async Task<IActionResult> GetTransactions(
        Guid cardId,
        [FromQuery] int? month,
        [FromQuery] int? year)
    {
        var result = await _cardService
            .GetTransactionsAsync(GetUserId(), cardId, month, year);
        return Ok(result);
    }

    [HttpPost("{cardId:guid}/transactions")]
    public async Task<IActionResult> AddTransaction(
        Guid cardId, [FromBody] CreateCardTransactionDto dto)
    {
        var result = await _cardService
            .AddTransactionAsync(GetUserId(), cardId, dto);
        return Ok(result);
    }

    [HttpPut("{cardId:guid}/transactions/{transactionId:guid}")]
    public async Task<IActionResult> UpdateTransaction(
        Guid cardId, Guid transactionId, [FromBody] UpdateCardTransactionDto dto)
    {
        var result = await _cardService
            .UpdateTransactionAsync(GetUserId(), cardId, transactionId, dto);
        return Ok(result);
    }

    [HttpDelete("{cardId:guid}/transactions/{transactionId:guid}")]
    public async Task<IActionResult> DeleteTransaction(
        Guid cardId, Guid transactionId)
    {
        await _cardService
            .DeleteTransactionAsync(GetUserId(), cardId, transactionId);
        return NoContent();
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var result = await _cardService.GetCardsSummaryAsync(GetUserId());
        return Ok(result);
    }
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. Nested resource URLs         - `/creditcards/{cardId}/transactions` is RESTful nested
                                    resource design. The transaction URL always includes its
                                    parent card ID — ownership is baked into the URL structure.
  2. Two route parameters         - DeleteTransaction takes both cardId and transactionId.
                                    The service verifies both — the transaction must belong
                                    to that specific card which must belong to that user.
  3. Consistent GetUserId()       - Same pattern as ExpensesController. Could be extracted
                                    to a base controller class — worth doing in Phase 7
                                    when all controllers exist.
*/