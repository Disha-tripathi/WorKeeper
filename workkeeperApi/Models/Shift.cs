using System;
using System.Collections.Generic;

namespace workkeeperApi.Models;

public partial class Shift
{
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public TimeOnly StartTime { get; set; }

        public TimeOnly EndTime { get; set; }

        public TimeSpan? BreakDuration { get; set; }

        public DateTime? createdat { get; set; }

        public decimal ExpectedHours { get; set; }

    public virtual ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();

    public virtual ICollection<Employee> Employees { get; set; } = new List<Employee>();
}
