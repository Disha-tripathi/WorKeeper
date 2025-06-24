public class LeaveRequest
{
    public int EmployeeId { get; set; }
    public int LeaveTypeId { get; set; } // PL Id
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public required string Note { get; set; }
}
