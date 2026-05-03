using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AssetManagement.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class LoanTransactionRedesign : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop old tables (LoanPayments depends on Loans, so drop it first)
            migrationBuilder.DropTable(name: "LoanPayments");
            migrationBuilder.Sql("DROP TABLE IF EXISTS \"Loans\" CASCADE;");

            // Recreate Loans with integer Id and redesigned schema
            migrationBuilder.CreateTable(
                name: "Loans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    LoanName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LenderName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LoanType = table.Column<int>(type: "integer", nullable: false),
                    PrincipalAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    InterestRate = table.Column<decimal>(type: "numeric(5,2)", nullable: false),
                    TenureMonths = table.Column<int>(type: "integer", nullable: false),
                    EmiAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    buffer_period_months = table.Column<int>(type: "integer", nullable: false),
                    partial_interest_amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    emi_start_date = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    NextDueDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Loans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Loans_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Loans_UserId",
                table: "Loans",
                column: "UserId");

            // Create loan_transactions table
            migrationBuilder.CreateTable(
                name: "loan_transactions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    loan_id = table.Column<int>(type: "integer", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<int>(type: "integer", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    date = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    payment_method = table.Column<int>(type: "integer", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_loan_transactions", x => x.id);
                    table.ForeignKey(
                        name: "FK_loan_transactions_Loans_loan_id",
                        column: x => x.loan_id,
                        principalTable: "Loans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_loan_transactions_Users_user_id",
                        column: x => x.user_id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_loan_transactions_loan_id",
                table: "loan_transactions",
                column: "loan_id");

            migrationBuilder.CreateIndex(
                name: "IX_loan_transactions_user_id",
                table: "loan_transactions",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "loan_transactions");
            migrationBuilder.DropTable(name: "Loans");
        }
    }
}
