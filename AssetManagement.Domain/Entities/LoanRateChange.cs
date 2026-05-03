namespace AssetManagement.Domain.Entities;

public class LoanRateChange
{
    public int Id { get; set; }
    public int LoanId { get; set; }
    public Guid UserId { get; set; }
    public decimal NewRate { get; set; }       // Annual % e.g. 9.5
    public DateTime EffectiveDate { get; set; } // From this date, the new rate applies
    public string? Notes { get; set; }

    public Loan Loan { get; set; } = null!;
    public User User { get; set; } = null!;
}
