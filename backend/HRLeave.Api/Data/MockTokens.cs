using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace HRLeave.Api.Data;

/// <summary>
/// Generates demo JWT tokens for Swagger testing.
/// Run once: dotnet run --generate-tokens (or call GET /api/v1/dev/tokens in Development)
/// Tokens are non-expiring and use the secret key from appsettings.json.
/// </summary>
public static class MockTokens
{
    public static string Generate(string secretKey, int employeeId, string role, string email)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("EmployeeId", employeeId.ToString()),
            new Claim("Role", role),
            new Claim("Email", email)
        };

        var token = new JwtSecurityToken(
            claims:   claims,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
