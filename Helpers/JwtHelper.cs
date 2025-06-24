using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Identity;


namespace workkeeperApi.Helpers
{
    public class JwtHelper
    {
        private readonly IConfiguration _configuration;

        public JwtHelper(IConfiguration configuration)
        {
            _configuration = configuration;
        }
    public string GenerateToken(IdentityUser user, IList<string> roles)
    {
        var userName = user.UserName ?? throw new InvalidOperationException("UserName cannot be null.");
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, userName), 
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

    // `builder` hata diya, `_configuration` se value le rahe hain
    var secretKey = _configuration["JwtSettings:Secret"] ?? throw new InvalidOperationException("JWT Secret is missing.");
    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)); //  Convert to SecurityKey


    var token = new JwtSecurityToken(
        issuer: _configuration["JwtSettings:Issuer"],
        audience: _configuration["JwtSettings:Audience"],
        expires: DateTime.UtcNow.AddMinutes(60),
        claims: claims,
        signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
    );

    return new JwtSecurityTokenHandler().WriteToken(token);
    }
    }
}
