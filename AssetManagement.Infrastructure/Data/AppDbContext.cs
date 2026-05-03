using AssetManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AssetManagement.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    // Add these DbSets after RefreshTokens
public DbSet<Expense> Expenses => Set<Expense>();
public DbSet<ExpenseCategory> ExpenseCategories => Set<ExpenseCategory>();

public DbSet<CreditCard> CreditCards => Set<CreditCard>();
public DbSet<CardTransaction> CardTransactions => Set<CardTransaction>();
    public DbSet<Loan> Loans => Set<Loan>();
    public DbSet<LoanTransaction> LoanTransactions { get; set; }
    public DbSet<LoanRateChange> LoanRateChanges { get; set; }    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.FullName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.PinHash).IsRequired();
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.User)
                  .WithMany(u => u.RefreshTokens)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Expense>(entity =>
{
    entity.HasKey(e => e.Id);
    entity.Property(e => e.Amount)
          .HasColumnType("decimal(18,2)")
          .IsRequired();
    entity.Property(e => e.Title).HasMaxLength(200).IsRequired();
    entity.Property(e => e.Category).HasMaxLength(100).IsRequired();
    entity.HasOne(e => e.User)
          .WithMany()
          .HasForeignKey(e => e.UserId)
          .OnDelete(DeleteBehavior.Cascade);
});

        modelBuilder.Entity<ExpenseCategory>(entity =>
{
    entity.HasKey(e => e.Id);
    entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
    entity.HasOne(e => e.User)
          .WithMany()
          .HasForeignKey(e => e.UserId)
          .OnDelete(DeleteBehavior.Cascade);
});
    
    modelBuilder.Entity<CreditCard>(entity =>
{
    entity.HasKey(e => e.Id);
    entity.Property(e => e.CreditLimit)
          .HasColumnType("decimal(18,2)").IsRequired();
    entity.Property(e => e.CurrentBalance)
          .HasColumnType("decimal(18,2)");
    entity.Property(e => e.InterestRate)
          .HasColumnType("decimal(5,2)");
    entity.Property(e => e.LastFourDigits)
          .HasMaxLength(4).IsRequired();
    entity.Property(e => e.BankName)
          .HasMaxLength(100).IsRequired();
    entity.Property(e => e.CardName)
          .HasMaxLength(100).IsRequired();
    entity.HasOne(e => e.User)
          .WithMany()
          .HasForeignKey(e => e.UserId)
          .OnDelete(DeleteBehavior.Cascade);
});

modelBuilder.Entity<CardTransaction>(entity =>
{
    entity.HasKey(e => e.Id);
    entity.Property(e => e.Amount)
          .HasColumnType("decimal(18,2)").IsRequired();
    entity.Property(e => e.Title)
          .HasMaxLength(200).IsRequired();
    entity.HasOne(e => e.Card)
          .WithMany(c => c.Transactions)
          .HasForeignKey(e => e.CardId)
          .OnDelete(DeleteBehavior.Cascade);
});

modelBuilder.Entity<Loan>(entity =>
{
    entity.HasKey(e => e.Id);
    entity.Property(e => e.PrincipalAmount)
          .HasColumnType("decimal(18,2)").IsRequired();
    entity.Property(e => e.InterestRate)
          .HasColumnType("decimal(5,2)").IsRequired();
    entity.Property(e => e.EmiAmount)
          .HasColumnType("decimal(18,2)").IsRequired();
    entity.Property(e => e.LoanName)
          .HasMaxLength(100).IsRequired();
    entity.Property(e => e.LenderName)
          .HasMaxLength(100).IsRequired();
    entity.HasOne(e => e.User)
          .WithMany()
          .HasForeignKey(e => e.UserId)
          .OnDelete(DeleteBehavior.Cascade);
});


modelBuilder.Entity<LoanTransaction>(entity =>
{
    entity.ToTable("loan_transactions");
    entity.HasKey(e => e.Id);
    entity.Property(e => e.Id).HasColumnName("id");
    entity.Property(e => e.LoanId).HasColumnName("loan_id");
    entity.Property(e => e.UserId).HasColumnName("user_id");
    entity.Property(e => e.Type).HasColumnName("type");
    entity.Property(e => e.Amount).HasColumnName("amount").HasColumnType("decimal(18,2)");
    entity.Property(e => e.Date).HasColumnName("date");
    entity.Property(e => e.PaymentMethod).HasColumnName("payment_method");
    entity.Property(e => e.Notes).HasColumnName("notes");
 
    entity.HasOne(e => e.Loan)
          .WithMany(l => l.Transactions)
          .HasForeignKey(e => e.LoanId);
});
 
// Update Loan entity config — add new columns:
modelBuilder.Entity<Loan>(entity =>
{
    // ... existing config ...
    entity.Property(e => e.BufferPeriodMonths).HasColumnName("buffer_period_months");
    entity.Property(e => e.PartialInterestAmount).HasColumnName("partial_interest_amount").HasColumnType("decimal(18,2)");
    entity.Property(e => e.EmiStartDate).HasColumnName("emi_start_date");
 
    // REMOVE these if you had them:
    // entity.Property(e => e.OutstandingBalance) → no longer stored
    // entity.Property(e => e.PaidMonths) → no longer stored
 
    entity.HasMany(l => l.Transactions)
          .WithOne(t => t.Loan)
          .HasForeignKey(t => t.LoanId);
    entity.HasMany(l => l.RateChanges)
          .WithOne(r => r.Loan)
          .HasForeignKey(r => r.LoanId);
});

modelBuilder.Entity<LoanRateChange>(entity =>
{
    entity.HasKey(e => e.Id);
    entity.Property(e => e.NewRate).HasColumnType("decimal(5,2)").IsRequired();
    entity.Property(e => e.EffectiveDate).IsRequired();
    entity.HasOne(e => e.Loan)
          .WithMany(l => l.RateChanges)
          .HasForeignKey(e => e.LoanId)
          .OnDelete(DeleteBehavior.Cascade);
    entity.HasOne(e => e.User)
          .WithMany()
          .HasForeignKey(e => e.UserId)
          .OnDelete(DeleteBehavior.Cascade);
});

 
// ─── MIGRATION SQL ────────────────────────────────────────────────────────────
// Run this manually in your PostgreSQL DB, or generate via:
//   dotnet ef migrations add LoanTransactionRedesign
//   dotnet ef database update
 
/*
-- Step 1: Add new columns to loans table
ALTER TABLE loans
    ADD COLUMN buffer_period_months INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN partial_interest_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    ADD COLUMN emi_start_date TIMESTAMP NOT NULL DEFAULT NOW();
 
-- Step 2: Remove old calculated columns (only if they exist)
ALTER TABLE loans
    DROP COLUMN IF EXISTS outstanding_balance,
    DROP COLUMN IF EXISTS paid_months;
 
-- Step 3: Create new loan_transactions table
CREATE TABLE loan_transactions (
    id                  SERIAL PRIMARY KEY,
    loan_id             INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                INTEGER NOT NULL,          -- 0=Disbursement, 1=Payment
    amount              DECIMAL(18,2) NOT NULL,
    date                TIMESTAMP NOT NULL,
    payment_method      INTEGER NULL,              -- NULL for disbursements
    notes               TEXT NULL
);
 
-- Step 4: If migrating old loan_payments data → convert to transactions
-- All old payments become type=1 (Payment)
INSERT INTO loan_transactions (loan_id, user_id, type, amount, date, payment_method, notes)
SELECT 
    loan_id, 
    user_id, 
    1 AS type,           -- Payment
    amount_paid, 
    payment_date, 
    NULL,                -- Old table didn't have payment_method
    NULL
FROM loan_payments;
 
-- Step 5: Drop old table (after verifying migration above)
DROP TABLE IF EXISTS loan_payments;
*/
 
// ─── PROGRAM.CS REGISTRATION ──────────────────────────────────────────────────
// Add this in Program.cs where you register services:
/*
builder.Services.AddScoped<LoanCalculationService>();
builder.Services.AddScoped<ILoanService, LoanService>();
*/

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. Cascade on payments          - Delete a loan → all payments deleted. Referential
                                    integrity without manual cleanup code.
  2. decimal(18,2) consistency    - All money columns use the same precision/scale.
                                    Consistency prevents subtle rounding differences
                                    between columns in the same calculation.
*/
/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. decimal(5,2) for interest    - Interest rates like 18.99% need 5 total digits, 2
                                    decimal places. decimal(18,2) would work too but
                                    decimal(5,2) communicates the intent — it's a percentage.
  2. HasMaxLength(4) for digits   - Last four digits of a card are always exactly 4
                                    characters. MaxLength(4) enforces this at DB level.
  3. Cascade on CardTransaction   - Delete a card → all its transactions delete automatically.
                                    Referential integrity maintained without manual cleanup.
*/
    }

}