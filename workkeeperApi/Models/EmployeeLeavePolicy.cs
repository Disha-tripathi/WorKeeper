public class EmployeeLeavePolicy
{
    public int Id { get; set; }
    public int EmployeeId { get; set; }
    public int LeaveTypeId { get; set; }
    public int Year { get; set; }
    public int OpeningBalance { get; set; }
    public int Accrued { get; set; }
    public int Availed { get; set; }
    public int CarryForward { get; set; }
    public DateTime CreatedAt { get; set; }

    public LeaveType? LeaveType { get; set; }
}
