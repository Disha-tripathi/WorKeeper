using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace workkeeperApi.Models;

public partial class Employee
{
    public int Id { get; set; }

    public string? AspNetUsersId { get; set; }
    
    public string Name { get; set; } = null!;

    public string EmployeeUniqueId { get; set; } = null!;

    public string? EmploymentStatus { get; set; }

    public string MobileNumber { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? Department { get; set; }

    public string? Office { get; set; }

    public string? Team { get; set; }

    public string? Designation { get; set; }

    public string? EmployeeGroup { get; set; }

    public int? ExperienceTotalYears { get; set; }

    public int? ShiftId { get; set; }

    public string? EducationalDetails { get; set; }

    public string? AppraisalDetails { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual IdentityUser? User { get; set; }

    public virtual ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();

    public virtual Shift? Shift { get; set; }
}
