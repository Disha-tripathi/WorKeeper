public class RegisterRequest
{
    public required string UserName { get; set; }
    public required string Name { get; set; }

    public required string Email { get; set; }
    public required string Password { get; set; }

    public required string Role { get; set; } // "Employee", "Admin", or "Supervisor"
    public required string MobileNumber { get; set; }

    // Employee-only fields
    public int? ShiftId { get; set; }
    public int? Experience { get; set; }
    public  string? Education { get; set; }
    public  string? JobTitle { get; set; }
    // public required string? ReportsToUserId { get; set; } // Internal FK, not entered by user
}
