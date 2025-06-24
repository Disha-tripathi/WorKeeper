using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using workkeeperApi.Data;
using workkeeperApi.Mail;
using workkeeperApi.Models;

// AuthController: login aur registration ka main controller hai
[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager; // User se related kaam ke liye
    private readonly IConfiguration _config;         // AppSettings (config) access karne ke liye

    private readonly ApplicationDbContext _context; // Database me se employeeId leni hai 

    private readonly IMailService _mailService;

    public AuthController(UserManager<User> userManager, IConfiguration config, ApplicationDbContext context, IMailService mailService)
    {
        _userManager = userManager;
        _config = config;
        _context = context;
        _mailService = mailService;
        Console.WriteLine("✅ AuthController loaded");
    }

    [HttpGet]
    public IActionResult Result()
    {
        return Ok("Api working sucessfully");
    }
    // ME (Employee data) returns employee info from token claim (EmployeeId, Name, Role)
    [Authorize]
[HttpGet("me")]
public async Task<IActionResult> GetCurrentUser()
{
    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null)
        return Unauthorized(new { message = "User not authenticated." });

    var user = await _userManager.FindByIdAsync(userId);
    if (user == null)
        return NotFound(new { message = "User not found." });

    var roles = await _userManager.GetRolesAsync(user);
    var role = roles.FirstOrDefault();

    // Optional: Get EmployeeId if role is Employee

    var employee = await _context.Employees
        .FirstOrDefaultAsync(e => e.AspNetUsersId == userId);
            
    int? employeeId = employee?.Id;

    return Ok(new
        {
            user.Id,
            user.UserName,
            user.Email,
            user.Name,
            role,
            employeeId  //  Only set if employee
        });
}


    //  REGISTER 
    [HttpGet("registers")]
    public async Task<ActionResult> GetAllRegisteredUsers()
    {
        var users = await _userManager.Users.ToListAsync();

        return Ok(users);
    }
[HttpPost("register")]
public async Task<ActionResult> Register([FromBody] RegisterRequest request)
{
    // 1. Check if user already exists
    var userExists = await _userManager.Users
        .AnyAsync(u => u.Email == request.Email || u.UserName == request.UserName);

    if (userExists)
        return BadRequest(new { message = "User already exists with this email or username." });

    // 2. Create Identity user
    var user = new User
    {
        Name = request.Name,
        Role = request.Role,
        UserName = request.UserName,
        Email = request.Email,
        PhoneNumber = request.MobileNumber
    };

    var result = await _userManager.CreateAsync(user, request.Password);
    if (!result.Succeeded)
        return BadRequest(result.Errors);

    // 3. Assign Role
    await _userManager.AddToRoleAsync(user, request.Role);

    // 4. Save profile based on role
    switch (request.Role.ToLower())
    {
        case "employee":
            var employee = new Employee
            {
                AspNetUsersId = user.Id,
                Name = request.Name,
                Email = request.Email,
                MobileNumber = request.MobileNumber,
                ShiftId = request.ShiftId,
                ExperienceTotalYears = request.Experience,
                EducationalDetails = request.Education,
                CreatedAt = DateTime.UtcNow,
                EmploymentStatus = "Active",
                EmployeeUniqueId = await GenerateUniqueIdAsync("EMP", "employee"),
                JobTitle = request.JobTitle,
            };
            _context.Employees.Add(employee);
            break;

        case "admin":
            var admin = new Admin
            {
                AspNetUsersId = user.Id,
                Name = request.Name,
                Email = request.Email,
                MobileNumber = request.MobileNumber,
                CreatedAt = DateTime.UtcNow,
                AdminUniqueId = await GenerateUniqueIdAsync("ADM", "admin")
            };
            _context.Admins.Add(admin);
            
            var adminEmployee = new Employee
            {
                AspNetUsersId = user.Id,
                Name = request.Name,
                Email = request.Email,
                MobileNumber = request.MobileNumber,
                CreatedAt = DateTime.UtcNow,
                EmploymentStatus = "Active",
                ShiftId = request.ShiftId, 
                EmployeeUniqueId = await GenerateUniqueIdAsync("EMP", "employee")
            };
            _context.Employees.Add(adminEmployee);
                break;

        case "supervisor":
            var supervisor = new Supervisor
            {
                AspNetUsersId = user.Id,
                Name = request.Name,
                Email = request.Email,
                MobileNumber = request.MobileNumber,
                CreatedAt = DateTime.UtcNow,
                SupervisorUniqueId = await GenerateUniqueIdAsync("SUP", "supervisor")
            };
            _context.Supervisors.Add(supervisor);

            var supervisorEmployee = new Employee
            {
                AspNetUsersId = user.Id,
                Name = request.Name,
                Email = request.Email,
                MobileNumber = request.MobileNumber,
                CreatedAt = DateTime.UtcNow,
                EmploymentStatus = "Active",
                ShiftId = request.ShiftId,
                EmployeeUniqueId = await GenerateUniqueIdAsync("EMP", "employee")
            };

               _context.Employees.Add(supervisorEmployee);
            break;

        default:
            return BadRequest("Invalid role. Use only: Employee, Admin, or Supervisor.");
    }

    await _context.SaveChangesAsync();

    // 5. Generate email confirmation token
    var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
    var confirmationLink = Url.Action("ConfirmEmail", "Auth", new { userId = user.Id, token = token }, Request.Scheme);

    // 6. Send confirmation email
    var emailBody = $@"
        <html>
            <body style='font-family: Arial, sans-serif;'>
                <h2>Hello {request.Name},</h2>
                <p>Welcome to WorkKeeper! Please confirm your email by clicking the button below:</p>
                <p>
                    <a href='{confirmationLink}' style='
                        background-color: #6366f1;
                        color: white;
                        padding: 10px 15px;
                        text-decoration: none;
                        border-radius: 5px;
                        display: inline-block;'>Confirm Email</a>
                </p>
                <p>If the above link doesn't work, copy and paste this into your browser:</p>
                <p><a href='{confirmationLink}'>{confirmationLink}</a></p>
            </body>
        </html>";

    await _mailService.SendEmailAsync(user.Email, "Confirm your email - WorkKeeper", emailBody);

    return Ok(new { message = $"{request.Role} registered successfully. Confirmation email sent." });
}


    // LOGIN - Token ke saath cookie bhi set ho rahi hai
    [HttpPost("login")]
    public async Task<ActionResult> login([FromBody] LoginRequest request)
    {
        // Step 1: Username se user dhundh rahe hain
        var user = await _userManager.FindByNameAsync(request.Username);

        // Step 2: Agar user nahi mila ya password galat hai to Unauthorized error
        if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
        {
            return Unauthorized(new { message = "Invalid username or password" });
        }

        // Step 3: User ke roles nikaal lo (Admin, Employee, etc.)
        var roles = await _userManager.GetRolesAsync(user);

        // Step 3.1: EmployeeId nikaal lo
        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.AspNetUsersId == user.Id);
        int? employeeId = employee?.Id;

        // Step 4: JWT access token aur refresh token generate karo
        var accessToken = GenerateJwtToken(user, roles, employeeId);
        var refreshToken = GenerateRefreshToken();

        // Step 5: Refresh token DB me save karo, expiry ke saath
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        // Step 6: Access token ke liye cookie options bana rahe hain
        var accessTokenCookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = _config.GetValue<bool>("JwtSettings:UseSecureCookie", false),
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(_config.GetValue<int>("JwtSettings:RefreshTokenExpiryDays", 7)),
        };

        // Step 7: Refresh token ke liye bhi cookie options
        var refreshTokenCookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(7)
        };

        // Step 8: Dono tokens ko client ke browser me cookie ke through bhej rahe hain
        Response.Cookies.Append("access_token", accessToken, accessTokenCookieOptions);
        Response.Cookies.Append("refreshToken", refreshToken, refreshTokenCookieOptions);

        // Step 9: Response me sirf role aur message bhejna hai (token nahi bhejna)
        // Step 9: Response me role, message aur accessToken bhejna hai
        return Ok(new
        {
            accessToken = accessToken,
            role = roles,
            employeeId = employee?.Id,
            message = "Login successful"
        });

    }

    // REFRESH TOKEN ENDPOINT
    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken()
    {
        // Client se refresh token cookie me milta hai
        var refreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrEmpty(refreshToken)) return Unauthorized(new { message = "Token expired or invalid. Please login again." });


        // DB me user dhundho jiska refresh token ye hai
        var user = await _userManager.Users.SingleOrDefaultAsync(u => u.RefreshToken == refreshToken);

        // Agar user nahi mila ya token expired hai
        if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            return Unauthorized(new { message = "Token expired or invalid. Please login again." });


        // User ke roles nikaal rahe hain
        var roles = await _userManager.GetRolesAsync(user);

        // Naya access token aur refresh token generate karo
        var newAccessToken = GenerateJwtToken(user, roles);
        var newRefreshToken = GenerateRefreshToken();

        // Naya refresh token DB me save karo
        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _userManager.UpdateAsync(user);

        // Naya refresh token cookie me bhi bhej do
        Response.Cookies.Append("refreshToken", newRefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Expires = DateTime.UtcNow.AddDays(7)
        });

        // Naya access token bhej rahe hain
        return Ok(new { accessToken = newAccessToken, refreshToken = newRefreshToken });

    }

    private async Task<string> GenerateUniqueIdAsync(string prefix, string table)
    {
        string? lastId = null;

        switch (table.ToLower())
        {
            case "employee":
                lastId = await _context.Employees.OrderByDescending(e => e.Id).Select(e => e.EmployeeUniqueId).FirstOrDefaultAsync();
                break;

            case "admin":
                lastId = await _context.Admins
                    .OrderByDescending(a => a.Id)
                    .Select(a => a.AdminUniqueId)
                    .FirstOrDefaultAsync();
                break;

            case "supervisor":
                lastId = await _context.Supervisors
                    .OrderByDescending(s => s.Id)
                    .Select(s => s.SupervisorUniqueId)
                    .FirstOrDefaultAsync();
                break;
        }

        int lastNumber = 0;
        if (!string.IsNullOrEmpty(lastId) && lastId.Length > prefix.Length)
        {
            var numberPart = lastId.Substring(prefix.Length);
            int.TryParse(numberPart, out lastNumber);
        }

        return $"{prefix}{(lastNumber + 1).ToString("D3")}";
    }


    // JWT TOKEN GENERATOR 
    private string GenerateJwtToken(User user, IList<string> roles, int? employeeId = null)
    {
        // Secret key config file se nikaal rahe hain
        var secretKey = _config["JwtSettings:Secret"];

        if (string.IsNullOrEmpty(secretKey))
        {
            throw new Exception("JWT Secret Key is missing from configuration.");
        }

        // Secret key ko bytes me convert karna padta hai
        var key = Encoding.UTF8.GetBytes(secretKey);

        // Signing credentials banate hain (token ko sign karne ke liye)
        var creds = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256);

        // User ki details ko claim me daal rahe hain (naam, email, id)
        var claims = new List<Claim>
        {
            
            // new Claim(ClaimTypes.NameIdentifier, Employee.AspNetUsersId),
            new Claim(ClaimTypes.GivenName, user.Name),
            new Claim(ClaimTypes.Name, user.UserName ?? ""),
            new Claim(ClaimTypes.Email, user.Email ?? ""),
            new Claim(ClaimTypes.NameIdentifier, user.Id ?? "")

        };

        if (employeeId.HasValue)
        {
            claims.Add(new Claim("EmployeeId", employeeId.Value.ToString()));
        }

        // Har role ko alag claim ke roop me add karte hain
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        // JWT token banate hain - issuer, audience, claims, expiry sab set kar ke
        var token = new JwtSecurityToken(
            issuer: _config["JwtSettings:Issuer"],
            audience: _config["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        // Token ko string format me convert karke return karte hain
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // Helper method to generate refresh token
    private string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Unauthorized();

        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = DateTime.MinValue;
        await _userManager.UpdateAsync(user);

        Response.Cookies.Delete("refreshToken");
        Response.Cookies.Delete("access_token");

        return Ok(new { message = "Logged out successfully" });
    }

    public class ForgotPasswordRequest
    {
        public required string Email { get; set; }
    }
[HttpPost("forgot-password")]
public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
{
    var user = await _userManager.FindByEmailAsync(request.Email);
    if (user == null)
        return BadRequest(new { message = "No account found with this email." });

    var token = await _userManager.GeneratePasswordResetTokenAsync(user);
    
    // 👇 Use your frontend URL for reset
    var resetLink = $"http://localhost:5173/reset-password?token={Uri.EscapeDataString(token)}&email={Uri.EscapeDataString(request.Email)}";

    var body = $@"
        <p>Hi {user.UserName},</p>
        <p>Click the link below to reset your password:</p>
        <a href='{resetLink}'>Reset Password</a>";

    await _mailService.SendEmailAsync(request.Email, "Reset Your Password - WorkKeeper", body);

    return Ok(new { message = "Reset password link sent." });
}

[HttpPost("reset-password")]
public async Task<IActionResult> ResetPassword([FromBody] Dictionary<string, string> data)
{
    try
    {
        // ✅ Step 1: Validate input fields from body
        if (!data.TryGetValue("email", out var email) ||
            !data.TryGetValue("token", out var token) ||
            !data.TryGetValue("newPassword", out var newPassword))
        {
            return BadRequest(new { message = "Missing required fields." });
        }

        // ✅ Step 2: Find user by email
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            Console.WriteLine($"❌ Reset failed: No user found with email: {email}");
            return BadRequest(new { message = "Invalid email." });
        }

        // ✅ Step 3: Try resetting password using Identity
        var result = await _userManager.ResetPasswordAsync(user, token, newPassword);
        if (!result.Succeeded)
        {
            // 🔍 Log individual identity errors
            var errors = result.Errors.Select(e => e.Description);
            Console.WriteLine("❌ Reset failed due to: " + string.Join(", ", errors));
            return BadRequest(new { message = string.Join(", ", errors) });
        }

        // ✅ Step 4: Return success
        Console.WriteLine($"✅ Password reset successful for: {email}");
        return Ok(new { message = "Password reset successful." });
    }
    catch (Exception ex)
    {
        // 🧨 Log detailed error including InnerException
        var innerError = ex.InnerException?.Message ?? ex.Message;
        Console.WriteLine("💥 Exception in ResetPassword:");
        Console.WriteLine("    Error: " + ex.Message);
        if (ex.InnerException != null)
            Console.WriteLine("    InnerException: " + ex.InnerException.Message);

        return StatusCode(500, new
        {
            message = "Internal server error",
            details = innerError
        });
    }
}


    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] Dictionary<string, string> data)
    {
        if (!data.TryGetValue("currentPassword", out var currentPassword) ||
            !data.TryGetValue("newPassword", out var newPassword))
        {
            return BadRequest(new { message = "Missing current or new password." });
        }

        var user = await _userManager.GetUserAsync(User);
        if (user == null)
            return Unauthorized("User not found.");

        var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok(new { message = "Password changed successfully." });
    }

[HttpGet("confirm-email")]
public async Task<IActionResult> ConfirmEmail([FromQuery] string userId, [FromQuery] string token)
{
    var user = await _userManager.FindByIdAsync(userId);
    if (user == null)
        return NotFound(new { message = "User not found." });

    var result = await _userManager.ConfirmEmailAsync(user, token);
    if (!result.Succeeded)
        return BadRequest(new { message = "Invalid or expired token." });

    var roles = await _userManager.GetRolesAsync(user);
    var employee = await _context.Employees.FirstOrDefaultAsync(e => e.AspNetUsersId == user.Id);
    int? employeeId = employee?.Id;

    var accessToken = GenerateJwtToken(user, roles, employeeId);
    var refreshToken = GenerateRefreshToken();

    user.RefreshToken = refreshToken;
    user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
    await _userManager.UpdateAsync(user);

    // Store refresh token in cookies (optional)
    Response.Cookies.Append("refreshToken", refreshToken, new CookieOptions
    {
        HttpOnly = true,
        Expires = DateTime.UtcNow.AddDays(7),
        SameSite = SameSiteMode.Strict,
        Secure = true
    });

    // 🔁 Redirect to frontend dashboard with token and info
    var redirectUrl = $"http://localhost:5173/login?confirmed=true";
    return Redirect(redirectUrl);
}


}
