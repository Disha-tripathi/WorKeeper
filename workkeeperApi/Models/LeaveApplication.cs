using System.ComponentModel.DataAnnotations.Schema;
using workkeeperApi.Models;

public class LeaveApplication
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }

    public int LeaveTypeId { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    public int TotalDays { get; set; }

    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected, Withdrawn

    public DateTime AppliedOn { get; set; }

    public int? ApprovedBy { get; set; }

    public DateTime? ApprovedOn { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }

    public LeaveType? LeaveType { get; set; }

    public Employee Employee { get; set; } = null!;


}
