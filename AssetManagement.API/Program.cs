using System.Text;
using AssetManagement.API.Middleware;
using AssetManagement.Application.interfaces;
using AssetManagement.Application.Interfaces;
using AssetManagement.Infrastructure.Data;
using AssetManagement.Application.Services;
using AssetManagement.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;


var builder = WebApplication.CreateBuilder(args);

// ── Database ───────────────────────────────────────────────
// Fix PostgreSQL DateTime UTC requirement globally
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<ICreditCardService, CreditCardService>();
builder.Services.AddScoped<LoanCalculationService>();
builder.Services.AddScoped<ILoanService, LoanService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
// ── Authentication (JWT) ───────────────────────────────────
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secret = jwtSettings["Secret"]!;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer           = true,
        ValidateAudience         = true,
        ValidateLifetime         = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer              = jwtSettings["Issuer"],
        ValidAudience            = jwtSettings["Audience"],
        IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
        ClockSkew                = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// ── CORS ───────────────────────────────────────────────────
var corsEnv = Environment.GetEnvironmentVariable("CORS_ORIGINS");
var allowedOrigins = corsEnv?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? [];

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClient", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ── Controllers + Swagger ──────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<IExpenseService, ExpenseService>();

var app = builder.Build();

// ── Middleware Pipeline ────────────────────────────────────
app.UseCors("AllowClient");
app.UseMiddleware<ExceptionMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();

// ── Auto-run Migrations on Startup ────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.Run();
