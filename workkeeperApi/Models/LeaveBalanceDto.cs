public class LeaveBalanceDto
{
    public string LeaveType { get; set; } = string.Empty;
    public int Taken { get; set; }
    public int Remaining { get; set; }
    public bool IsOverused { get; set; }
}
