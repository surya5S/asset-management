using AssetManagement.Domain.Entities;

namespace AssetManagement.Application.interfaces;

public interface IJwtService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
}