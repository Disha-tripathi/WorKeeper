using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;


namespace workkeeperApi.Models;


[Table("Employee")]

public partial class Employee
{
    public int Id { get; set; }

    public string? AspNetUsersId { get; set; }

    public string Name { get; set; } = null!;

    public string EmployeeUniqueId { get; set; } = null!;

    public string? EmploymentStatus { get; set; }

    public string? MobileNumber { get; set; }

    public string Email { get; set; } = null!;

    public string? Department { get; set; }

    public string? Office { get; set; }

    public string? Team { get; set; }

    public string? Role { get; set; }

    public string? EmployeeGroup { get; set; }

    public int? ExperienceTotalYears { get; set; }

    public int? ShiftId { get; set; }

    public string? EducationalDetails { get; set; }

    public string? AppraisalDetails { get; set; }

    public string? JobTitle { get; set; }

    public string? ReportsToUserId { get; set; }


    public DateTime? CreatedAt { get; set; }

    [ForeignKey("AspNetUsersId")]
    public IdentityUser? AspNetUser { get; set; }

    public ICollection<LeaveApplication>? LeaveApplications { get; set; }

    public Shift? Shift { get; set; }


}
