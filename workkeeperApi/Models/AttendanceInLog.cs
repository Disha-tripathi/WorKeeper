

namespace workkeeperApi.Models;

public enum SourceEnum
{
    punch_machine,
    thumb_scanner,
    web_portal,
    mobile_app,
    hr_manual,
    api_import
}

public class AttendanceInLog
{
    public int Id { get; set; }

    public int EmployeeId { get; set; }

    public int ShiftId { get; set; }

    public string PunchType { get; set; } = string.Empty;

    public DateTime PunchDateTime { get; set; }

    public DateTime CreatedAt { get; set; }

    public string Status { get; set; } = string.Empty;

    public SourceEnum Source { get; set; }  // enum

    public string? EditedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }


    public Employee Employee { get; set; } = null!;
    public Shift Shift { get; set; } = null!;
}
