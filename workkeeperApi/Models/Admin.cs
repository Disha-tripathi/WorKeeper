using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

[Table("Admin")]
public class Admin
{
    public int Id { get; set; }

    public  string? AspNetUsersId { get; set; }

    public required string Name { get; set; }

    public required string Email { get; set; }

    public string? MobileNumber { get; set; }

    public required string AdminUniqueId { get; set; }

    public DateTime CreatedAt { get; set; }

    [ForeignKey("AspNetUsersId")]
    public IdentityUser? AspNetUser { get; set; }
}
