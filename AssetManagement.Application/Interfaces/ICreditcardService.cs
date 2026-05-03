using AssetManagement.Application.DTOs.Cards;

namespace AssetManagement.Application.Interfaces;

public interface ICreditCardService
{
    Task<List<CreditCardDto>>     GetAllCardsAsync(Guid userId);
    Task<CreditCardDto>           GetCardByIdAsync(Guid userId, Guid cardId);
    Task<CreditCardDto>           CreateCardAsync(Guid userId, CreateCreditCardDto dto);
    Task<CreditCardDto>           UpdateCardAsync(Guid userId, Guid cardId, CreateCreditCardDto dto);
    Task                          DeleteCardAsync(Guid userId, Guid cardId);
    Task<List<CardTransactionDto>> GetTransactionsAsync(Guid userId, Guid cardId, int? month, int? year);
    Task<CardTransactionDto>      AddTransactionAsync(Guid userId, Guid cardId, CreateCardTransactionDto dto);
    Task<CardTransactionDto>      UpdateTransactionAsync(Guid userId, Guid cardId, Guid transactionId, UpdateCardTransactionDto dto);
    Task                          DeleteTransactionAsync(Guid userId, Guid cardId, Guid transactionId);
    Task<CardsSummaryDto>         GetCardsSummaryAsync(Guid userId);
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. Nested resource pattern      - Transactions belong to a card. Methods take both userId
                                    and cardId — ownership verified at two levels. You must
                                    own the card AND the transaction must belong to that card.
  2. Task without return          - `Task DeleteCardAsync(...)` returns no value — it either
                                    succeeds or throws. Void async methods return Task, not
                                    Task<void> (which doesn't exist in C#).
*/