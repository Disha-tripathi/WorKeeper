using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

[Table("Supervisor")]
public class Supervisor
{
    public int Id { get; set; }

    public string AspNetUsersId { get; set; }

    public string Name { get; set; }

    public string Email { get; set; }

    public string? MobileNumber { get; set; }

    public string SupervisorUniqueId { get; set; }

    public DateTime CreatedAt { get; set; }

    [ForeignKey("AspNetUsersId")]
    public IdentityUser AspNetUser { get; set; }
}
