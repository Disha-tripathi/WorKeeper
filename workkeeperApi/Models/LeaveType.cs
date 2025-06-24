using System.Text.Json.Serialization;

public class LeaveType
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AccrualPolicy { get; set; } // Monthly, Fixed, etc.
    public int? MaxPerYear { get; set; }
    public bool IsPaid { get; set; }
    public bool IsCarryForward { get; set; }
    public string? Eligibility { get; set; }

    [JsonIgnore] // due to a cycle
    public ICollection<LeaveApplication>? LeaveApplication { get; set; }

    [JsonIgnore] // due to a cycle
    public ICollection<EmployeeLeavePolicy>? EmployeeLeavePolicy { get; set; }
}
