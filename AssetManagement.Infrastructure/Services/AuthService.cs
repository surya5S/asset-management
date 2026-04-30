using AssetManagement.Application.DTOs.Auth;
using AssetManagement.Application.interfaces;
using AssetManagement.Domain.Entities;
using AssetManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AssetManagement.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IJwtService  _jwt;

    public AuthService(AppDbContext db, IJwtService jwt)
    {
        _db  = db;
        _jwt = jwt;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        if (dto.Password != dto.ConfirmPassword)
            throw new InvalidOperationException("Passwords do not match.");

        if (dto.Pin.Length < 4 || dto.Pin.Length > 6 || !dto.Pin.All(char.IsDigit))
            throw new InvalidOperationException("PIN must be 4–6 digits.");

        var exists = await _db.Users.AnyAsync(u => u.Email == dto.Email.ToLower());
        if (exists)
            throw new InvalidOperationException("Email already registered.");

        var user = new User
        {
            FullName     = dto.FullName.Trim(),
            Email        = dto.Email.ToLower().Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            PinHash      = BCrypt.Net.BCrypt.HashPassword(dto.Pin),
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return await BuildAuthResponse(user);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower());

        if (user == null || !user.IsActive)
            throw new UnauthorizedAccessException("Invalid credentials.");

        var validPassword = !string.IsNullOrEmpty(dto.Password) &&
                             BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);

        var validPin = !string.IsNullOrEmpty(dto.Pin) &&
                        BCrypt.Net.BCrypt.Verify(dto.Pin, user.PinHash);

        if (!validPassword && !validPin)
            throw new UnauthorizedAccessException("Invalid credentials.");

        return await BuildAuthResponse(user);
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
    {
        var stored = await _db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == refreshToken);

        if (stored == null || !stored.IsActive)
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");

        stored.RevokedAt = DateTime.UtcNow;

        var newRefresh = new RefreshToken
        {
            UserId    = stored.UserId,
            Token     = _jwt.GenerateRefreshToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
        };

        _db.RefreshTokens.Add(newRefresh);
        await _db.SaveChangesAsync();

        return new AuthResponseDto
        {
            AccessToken  = _jwt.GenerateAccessToken(stored.User),
            RefreshToken = newRefresh.Token,
            User = new UserDto
            {
                Id       = stored.User.Id,
                FullName = stored.User.FullName,
                Email    = stored.User.Email,
            }
        };
    }

    public async Task RevokeTokenAsync(string refreshToken)
    {
        var stored = await _db.RefreshTokens
            .FirstOrDefaultAsync(r => r.Token == refreshToken);

        if (stored != null && stored.IsActive)
        {
            stored.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    private async Task<AuthResponseDto> BuildAuthResponse(User user)
    {
        var refreshToken = new RefreshToken
        {
            UserId    = user.Id,
            Token     = _jwt.GenerateRefreshToken(),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
        };

        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync();

        return new AuthResponseDto
        {
            AccessToken  = _jwt.GenerateAccessToken(user),
            RefreshToken = refreshToken.Token,
            User = new UserDto
            {
                Id       = user.Id,
                FullName = user.FullName,
                Email    = user.Email,
            }
        };
    }
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. Service Layer                - Business logic lives here. The controller stays thin —
                                    it just calls the service and returns the result.
                                    All the real decisions (validate, hash, check) happen here.
  2. BCrypt.HashPassword          - One-way hashing. The original password is never stored.
                                    BCrypt automatically generates and embeds a salt —
                                    same password hashed twice produces different results.
  3. BCrypt.Verify                - Checks if a plain text password matches a stored hash.
                                    Extracts the salt from the hash and re-hashes to compare.
  4. AnyAsync                     - EF Core LINQ — checks if any record matches without
                                    loading the full entity. Efficient duplicate email check.
  5. Generic Error Message        - "Invalid credentials" for both wrong email AND wrong
                                    password. Never tell the attacker which one was wrong —
                                    that's information they can use.
  6. Refresh Token Rotation       - On every refresh: old token is revoked, new one issued.
                                    If a stolen token is used, the legitimate user's next
                                    refresh fails — you detect the breach immediately.
  7. Include (Eager Loading)      - `.Include(r => r.User)` tells EF to JOIN and load the
                                    related User record in the same query. Without it,
                                    `stored.User` would be null (lazy loading is off by default).
  8. Private Helper Method        - `BuildAuthResponse` is reused by Register and Login.
                                    DRY principle — Don't Repeat Yourself.
  9. ToLower on Email             - Emails are case-insensitive. Storing and querying
                                    lowercased ensures `User@Email.com` and `user@email.com`
                                    are treated as the same account.
  10. PIN Validation              - `All(char.IsDigit)` checks every character is a digit.
                                    Length check (4–6) enforced in the service, not just the client.
*/