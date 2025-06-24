using System;
using System.ComponentModel.DataAnnotations.Schema;

using NpgsqlTypes;

namespace workkeeperApi.Models
{

    [Table("Attendance")]
    public class Attendance
    {
        public int Id { get; set; }

        public int EmployeeId { get; set; }

        public DateTime Date { get; set; }

        public int ShiftId { get; set; }

        public DateTime? InTime { get; set; }

        public DateTime? OutTime { get; set; }

        public string? Status { get; set; }

        public bool IsManual { get; set; }

        public decimal? TotalHours { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public string? EditedBy { get; set; }

        public string? PunchStatus { get; set; }
        
        public Employee? Employee { get; set; }
    }
}
