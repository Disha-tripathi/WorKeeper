
public enum SourceEnumRequest
{
    punch_machine,
    thumb_scanner,
    web_portal,
    mobile_app,
    hr_manual,
    api_import
}


public class AttendanceRequestModel
{
    public int EmployeeId { get; set; }
    public int ShiftId { get; set; }
    
    public required SourceEnumRequest Source { get; set; }
}
