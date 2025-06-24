using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace workkeeperApi.Models;

[Table("AttendanceInLog")]
public partial class AttendanceInLog
{
    // Primary Key
    public int Id { get; set; }

    // Employee ID (Foreign Key)
    public int EmployeeId { get; set; }

    // Shift ID (Foreign Key)
    public int ShiftId { get; set; }

    // Punch Type (In/Out)
    public string PunchType { get; set; } = null!;

    // Date and Time of the Punch
    public DateTime PunchDateTime { get; set; }

    // Source of the punch (e.g., Machine, Web)
    public string Source { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    // Navigation property to Employee (to avoid circular references)
    [JsonIgnore] 
    public virtual Employee? Employee { get; set; } 

    // Navigation property to Shift
    [JsonIgnore]
    public virtual Shift? Shift { get; set; }

     [NotMapped]  // Tell EF Core to ignore this property
    public string? Status
    {
        get
        {
            // Example: You can calculate the status based on other properties
            if (PunchType == "In")
                return "Present";
            else if (PunchType == "Out")
                return "Absent";
            else
                return "Unknown";
        }
    }

}
