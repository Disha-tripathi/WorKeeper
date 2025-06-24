using workkeeperApi.Models;

public class Alert
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }

    public string Message { get; set; } = null!;

    public string Type { get; set; } = "General"; // Leave, Attendance, System

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
