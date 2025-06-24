using workkeeperApi.Models;

    public class EditAttendanceDto
    {
        public DateTime? InTime { get; set; }
        public DateTime? OutTime { get; set; }
        // public AttendanceStatus Status { get; set; }
        // public required string EditedBy { get; set; } // e.g., "Admin", "Supervisor", or "Employee (John Doe)"
    }
