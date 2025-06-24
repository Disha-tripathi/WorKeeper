using workkeeperApi.Models;

public class EmployeeDashboardDto
{
    public int EmployeeId { get; set; }
    public string FullName { get; set; } = "";
    public string Department { get; set; } = "";
    public string Team { get; set; } = "";
    public string Role { get; set; } = "";
    public string EmployeeUniqueId { get; set; } = "";

    public PresenceDto? Presence { get; set; }
    public List<string> TodayLeave { get; set; } = new();
    public List<string> UpcomingLeaves { get; set; } = new();
    public List<string> YourTeam { get; set; } = new();
}
