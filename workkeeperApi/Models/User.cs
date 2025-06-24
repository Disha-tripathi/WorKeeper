using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace workkeeperApi.Models
{
    public class User : IdentityUser
    {
        public required string Name { get; set; }
        public required string Role { get; set; }

        // new
        public string? RefreshToken { get; set; }

        public DateTime? RefreshTokenExpiryTime { get; set; }
        
         public DbSet<Employee>? Employees { get; set; }
    }
}
