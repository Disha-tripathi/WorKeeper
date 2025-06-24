using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using workkeeperApi.Data;
using workkeeperApi.Models;

namespace workkeeperApi.Controllers;

[Authorize(Roles = "Admin")]
[Route("admin")]
[ApiController]
public class AdminController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly ApplicationDbContext _context;

    public AdminController(ApplicationDbContext context, UserManager<User> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    // DTO for employee creation
    public class AddEmployeeDto
    {
        public required string Name { get; set; }
        public required string Email { get; set; }
        public string? MobileNumber { get; set; }
        public string? JobTitle { get; set; }
        public string? Role { get; set; }
        public int? ShiftId { get; set; }
        public string? Department { get; set; }
        public string? Office { get; set; }
        public string? Team { get; set; }
        public string? EmployeeGroup { get; set; }
        public int? ExperienceTotalYears { get; set; }
        public string? EmploymentStatus { get; set; }
        public string? EducationalDetails { get; set; }
        public string? AppraisalDetails { get; set; }
        public string? ReportsToUserId { get; set; }
        public string Password { get; set; } = null!;
    }

    [HttpGet("/names/employees")]
    public async Task<IActionResult> GetAllEmployeesNames()
    {
        var employees = await _context.Employees
            .Select(e => new
            {
                id = e.Id,
                name = e.Name
            })
            .ToListAsync();

        return Ok(employees);
    }

    [HttpPost("employees")]
    public async Task<IActionResult> AddEmployee([FromBody] AddEmployeeDto model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = new User
        {
            Name = model.Name,
            Email = model.Email,
            Role = model.Role ?? "Employee",
        };

        var result = await _userManager.CreateAsync(user, model.Password);

        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await _userManager.AddToRoleAsync(user, "Employee");

        var empUniqueId = await GenerateUniqueIdAsync("EMP", "employee");

        var employee = new Employee
        {
            AspNetUsersId = user.Id,
            Name = model.Name,
            Email = model.Email,
            MobileNumber = model.MobileNumber,
            JobTitle = model.JobTitle,
            Role = model.Role,
            ShiftId = model.ShiftId,
            Department = model.Department,
            Office = model.Office,
            Team = model.Team,
            EmployeeGroup = model.EmployeeGroup,
            ExperienceTotalYears = model.ExperienceTotalYears,
            EmploymentStatus = model.EmploymentStatus,
            EducationalDetails = model.EducationalDetails,
            AppraisalDetails = model.AppraisalDetails,
            ReportsToUserId = model.ReportsToUserId,
            EmployeeUniqueId = empUniqueId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Employee added successfully" });
    }

[HttpGet("dashboard-overview")]
        public async Task<IActionResult> GetDashboardOverview()
        {
            // Use local system time (adjust to UTC if needed for your DB)
            var today = DateTime.Today;                // 2025-06-19 00:00:00
            var tomorrow = today.AddDays(1);           // 2025-06-20 00:00:00

            // Total number of employees
            var totalEmployees = await _context.Employees.CountAsync();

            // Count of employees who have marked attendance today as "Present"
            var presentToday = await _context.Attendances
                .Where(a =>
                    a.Date >= today &&
                    a.Date < tomorrow &&
                    a.Status == "Present")
                .Select(a => a.EmployeeId)
                .Distinct()
                .CountAsync();

            // Absent = Total - Present
            var absentToday = totalEmployees - presentToday;

            // Pending leave requests
            var pendingLeaves = await _context.LeaveApplication
                .Where(l => l.Status == "Pending")
                .CountAsync();

            // Count of distinct Shift IDs assigned to employees
            var upcomingShifts = await _context.Employees
                .Where(e => e.ShiftId != null)
                .Select(e => e.ShiftId)
                .Distinct()
                .CountAsync();

            // Final result
            return Ok(new
            {
                totalEmployees,
                presentToday,
                absentToday,
                pendingLeaves,
                upcomingShifts
            });
        }

    [HttpGet("employees")]
    public async Task<IActionResult> GetAllEmployees()
    {
        var employees = await _context.Employees
            .Select(e => new
            {
                e.Id,
                e.Name,
                e.Email,
                e.MobileNumber,
                e.JobTitle,
                e.Role,
                e.ShiftId,
                e.Department,
                e.Office,
                e.Team,
                e.EmployeeGroup,
                e.ExperienceTotalYears,
                e.EmploymentStatus,
                e.EducationalDetails,
                e.AppraisalDetails,
                e.ReportsToUserId,
                e.EmployeeUniqueId,
                e.CreatedAt
            })
            .ToListAsync();

        return Ok(employees);
    }
    public class UpdateEmployeeDto
    {
        public required string Name { get; set; }
        public required string Email { get; set; }

        public string? MobileNumber { get; set; }
        public string? JobTitle { get; set; }
        public string? Role { get; set; }
        public int? ShiftId { get; set; }
        public string? Department { get; set; }
        public string? Office { get; set; }
        public string? Team { get; set; }
        public string? EmployeeGroup { get; set; }
        public int? ExperienceTotalYears { get; set; }
        public string? EmploymentStatus { get; set; }
        public string? EducationalDetails { get; set; }
        public string? AppraisalDetails { get; set; }
        public string? ReportsToUserId { get; set; }
    }
    [HttpPut("employees/{id}")]
    public async Task<IActionResult> UpdateEmployee(int id, [FromBody] UpdateEmployeeDto model)
    {
        var employee = await _context.Employees.FindAsync(id);
        if (employee == null)
            return NotFound(new { message = "Employee not found." });

        // Update fields
        employee.Name = model.Name;
        employee.Email = model.Email;
        employee.MobileNumber = model.MobileNumber;
        employee.JobTitle = model.JobTitle;
        employee.Role = model.Role;
        employee.ShiftId = model.ShiftId;
        employee.Department = model.Department;
        employee.Office = model.Office;
        employee.Team = model.Team;
        employee.EmployeeGroup = model.EmployeeGroup;
        employee.ExperienceTotalYears = model.ExperienceTotalYears;
        employee.EmploymentStatus = model.EmploymentStatus;
        employee.EducationalDetails = model.EducationalDetails;
        employee.AppraisalDetails = model.AppraisalDetails;
        employee.ReportsToUserId = model.ReportsToUserId;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Employee updated successfully" });
    }

    [HttpDelete("employees/{id}")]
    public async Task<IActionResult> SoftDeleteEmployee(int id, [FromQuery] string? notes = null)
    {
        var employee = await _context.Employees.FindAsync(id);
        if (employee == null)
            return NotFound(new { message = "Employee not found." });

        // Step 1: Mark inactive
        employee.EmploymentStatus = "Inactive";

        // Step 2: Log the delete action
        var userId = User?.FindFirstValue(ClaimTypes.NameIdentifier) ?? "system"; // fallback

        var deleteLog = new DeleteLog
        {
            TableName = "Employee",
            RecordId = employee.Id,
            DeletedBy = userId,
            DeletedAt = DateTime.UtcNow,
            Notes = notes
        };

        _context.DeleteLogs.Add(deleteLog);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Employee soft-deleted and logged." });

    }

    // Utility: Unique ID Generator
    private async Task<string> GenerateUniqueIdAsync(string prefix, string table)
    {
        string? lastId = null;

        switch (table.ToLower())
        {
            case "employee":
                lastId = await _context.Employees
                    .OrderByDescending(e => e.Id)
                    .Select(e => e.EmployeeUniqueId)
                    .FirstOrDefaultAsync();
                break;

            case "admin":
                lastId = await _context.Admins
                    .OrderByDescending(a => a.Id)
                    .Select(a => a.AdminUniqueId)
                    .FirstOrDefaultAsync();
                break;

            case "supervisor":
                lastId = await _context.Supervisors
                    .OrderByDescending(s => s.Id)
                    .Select(s => s.SupervisorUniqueId)
                    .FirstOrDefaultAsync();
                break;
        }

        int lastNumber = 0;
        if (!string.IsNullOrEmpty(lastId) && lastId.Length > prefix.Length)
        {
            var numberPart = lastId.Substring(prefix.Length);
            int.TryParse(numberPart, out lastNumber);
        }

        return $"{prefix}{(lastNumber + 1).ToString("D3")}";
    }

    [HttpGet("attendance-logs")]
    public async Task<IActionResult> GetAttendanceLogs(
        [FromQuery] DateTime? date,
        [FromQuery] int? employeeId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _context.Attendances
            .Include(a => a.Employee)
            .AsQueryable();

        if (date.HasValue)
        {
            var nextDay = date.Value.Date.AddDays(1);
            query = query.Where(a => a.Date >= date.Value.Date && a.Date < nextDay);
        }

        if (employeeId.HasValue)
        {
            query = query.Where(a => a.EmployeeId == employeeId.Value);
        }

        var totalCount = await query.CountAsync();

        var records = await query
            .OrderByDescending(a => a.Date)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new
            {
                id = a.Id, 
                a.EmployeeId,
                EmployeeName = a.Employee!.Name,
                a.Date,
                a.Status,
                a.InTime,
                a.OutTime,
                a.TotalHours,
                a.PunchStatus
            })
            .ToListAsync();

        return Ok(new
        {
            totalCount,
            page,
            pageSize,
            records
        });
    }

    public class EditAttendanceDto
    {
        public string? Status { get; set; }
        public DateTime? InTime { get; set; }
        public DateTime? OutTime { get; set; }
        
    }

    
[HttpPut("edit-attendance/{id}")]
public async Task<IActionResult> EditAttendance(int id, [FromBody] EditAttendanceDto dto)
{
    var attendance = await _context.Attendances.FindAsync(id);
    if (attendance == null)
        return NotFound(new { message = "Attendance not found." });

    attendance.Status = dto.Status;
    attendance.InTime = dto.InTime;
    attendance.OutTime = dto.OutTime;
    attendance.IsManual = true;
    attendance.EditedBy = "admin_manual";
    attendance.CreatedAt = DateTime.UtcNow;

    if (dto.InTime.HasValue && dto.OutTime.HasValue)
    {
        var shift = await _context.Shifts.FindAsync(attendance.ShiftId);
        if (shift != null)
        {
            var breakDuration = shift.BreakDuration ?? TimeSpan.Zero;

            var workingDuration = dto.OutTime.Value - dto.InTime.Value - breakDuration;
            var totalHours = (decimal)Math.Round(workingDuration.TotalHours, 2);
            attendance.TotalHours = totalHours;

            var isLate = dto.InTime.Value.TimeOfDay > shift.StartTime.Add(TimeSpan.FromMinutes(15)).ToTimeSpan();
            var isHalfDay = totalHours < 4;
            var isOvertime = totalHours > (shift.ExpectedHours + 0.5m);

            attendance.PunchStatus = (isHalfDay, isLate, isOvertime) switch
            {
                (true, true, _) => "HalfDay + Late",
                (true, false, _) => "HalfDay",
                (false, true, true) => "Late + Overtime",
                (false, true, false) => "Late",
                (false, false, true) => "Overtime",
                _ => "OnTime"
            };
        }
    }
    else
    {
        // InTime or OutTime is missing – clear TotalHours and PunchStatus
        attendance.TotalHours = null;
        attendance.PunchStatus = null;
    }

    await _context.SaveChangesAsync();
    return Ok(new { message = "Attendance updated with punch status." });
}
[HttpGet("all-pending")]
public async Task<IActionResult> GetAllPendingLeaves()
{
    var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (userId == null) return Unauthorized();

    // This is your Identity user
    var identityUser = await _userManager.FindByIdAsync(userId);
    if (identityUser == null) return Unauthorized();

    // Map Identity user to your Employee table using Email (or Username)
    var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Email == identityUser.Email);
    if (employee == null) return Forbid(); // Not in Employees table

    // ✅ Custom manual role check
    if (employee.Role != "admin" && employee.Role != "supervisor")
        return Forbid(); // 👈 This causes the 403 if role is not allowed

    // Get all pending leaves
    var pendingLeaves = await _context.LeaveApplication
        .Include(l => l.Employee)
        .Include(l => l.LeaveType)
        .Where(l => l.Status == "Pending")
        .OrderByDescending(l => l.AppliedOn)
        .Select(l => new
        {
            l.Id,
            EmployeeName = l.Employee.Name,
            l.StartDate,
            l.EndDate,
            l.Status,
            LeaveType = l.LeaveType!.Name,
            l.AppliedOn
        })
        .ToListAsync();

    return Ok(pendingLeaves);
}



}
