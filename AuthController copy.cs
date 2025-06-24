using Microsoft.AspNetCore.Mvc; // Provides attributes and classes for handling HTTP requests in ASP.NET Core
using Microsoft.AspNetCore.Identity; // Manages user authentication and authorization
using Microsoft.IdentityModel.Tokens; // Handles token-based authentication
using System.IdentityModel.Tokens.Jwt; // Provides functionality to create and validate JWT tokens
using System.Security.Claims; // Defines claims-based authentication
using System.Text; // Supports encoding and decoding strings
using System.Threading.Tasks; // Supports asynchronous programming
using workkeeperApi.Models; // Imports custom models for user management
using Microsoft.Extensions.Configuration; // Provides access to configuration settings

[Route("api/auth")] // Defines the base route for authentication-related endpoints
[ApiController] // Marks this controller as an API controller
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager; // Manages user creation, deletion, and authentication
    private readonly SignInManager<User> _signInManager; // Handles user sign-in processes
    private readonly IConfiguration _config; // Stores application settings such as JWT configuration

    // Constructor to inject dependencies
    public AuthController(UserManager<User> userManager, SignInManager<User> signInManager, IConfiguration config)
    {
        _userManager = userManager; // Assigns the injected UserManager instance to the private field
        _signInManager = signInManager; // Assigns the injected SignInManager instance to the private field
        _config = config; // Assigns the injected IConfiguration instance to access application settings
    }

    [HttpPost("register")] // Defines the HTTP POST endpoint for user registration
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // Check if a user with the same email or username already exists
        if (await _userManager.FindByEmailAsync(request.Email) != null ||
            await _userManager.FindByNameAsync(request.UserName) != null)
        {
            return BadRequest(new { message = "User with this email or username already exists" });
        }

        // Create a new user instance
        var user = new User
        {
            Name = request.UserName,
            Email = request.Email,
            UserName = request.UserName,  
            Role = request.Role
        };

        // Attempt to create the user with the provided password
        var result = await _userManager.CreateAsync(user, request.Password);  

        if (!result.Succeeded)
        {
            return BadRequest(result.Errors); // Return errors if user creation fails
        }

        // Assign the specified role to the new user
        await _userManager.AddToRoleAsync(user, request.Role);
        return Ok(new { message = "User registered successfully" });
    }

    [HttpPost("login")] // Defines the HTTP POST endpoint for user login
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        // Find the user by username
        var user = await _userManager.FindByNameAsync(request.Username);
        
        // Validate the user's credentials
        if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
        {
            return Unauthorized(new { message = "Invalid username or password" });
        }
    
        // Retrieve the roles assigned to the user
        var roles = await _userManager.GetRolesAsync(user);

        // Generate a JWT token for authentication
        var token = GenerateJwtToken(user, roles);

        return Ok(new { token, role = roles }); // Return the token and roles
    }

    // Generates a JWT token for authenticated users
    private string GenerateJwtToken(User user, IList<string> roles)
    {
        // Retrieve the JWT secret key from the configuration
        var secretKey = _config["Jwt:Secret"];
        if (string.IsNullOrEmpty(secretKey))
        {
            throw new Exception("JWT Secret Key is missing from configuration.");
        }

        // Encode the secret key
        var key = Encoding.UTF8.GetBytes(secretKey);
        var creds = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256);

        // Define the claims to be included in the token
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.UserName ?? ""),
            new Claim(ClaimTypes.Email, user.Email ?? ""),
            new Claim(ClaimTypes.NameIdentifier, user.Id ?? "")
        };

        // Add user roles as claims
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        // Create the JWT token
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"], // JWT issuer
            audience: _config["Jwt:Audience"], // JWT audience
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2), // Token expiration time
            signingCredentials: creds // Token signing credentials
        );

        // Convert the token to a string and return it
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
