using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using workkeeperApi.Data;
using workkeeperApi.Models;

[Authorize(Roles = "Supervisor")] // Only Supervisor can access
[Route("supervisor")]
[ApiController]
public class SupervisorController : ControllerBase
{

    private readonly UserManager<User> _userManager;
    private readonly ApplicationDbContext _context;

    public SupervisorController(ApplicationDbContext context, UserManager<User> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

[HttpGet("dashboard-overview")]
public async Task<IActionResult> GetSupervisorDashboard()
{
    var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!int.TryParse(userIdStr, out int supervisorId))
        return Unauthorized();

    var supervisor = await _context.Employees.FindAsync(supervisorId);
    if (supervisor == null || string.IsNullOrEmpty(supervisor.Team))
        return BadRequest("Supervisor or team info missing.");

    var today = DateTime.Today;

    // Employees in supervisor's team
    var teamEmployees = await _context.Employees
        .Where(e => e.Team == supervisor.Team)
        .ToListAsync();

    var teamEmployeeIds = teamEmployees.Select(e => e.Id).ToList();
    var totalTeam = teamEmployeeIds.Count;

    // Present Today (safe null check for Status)
    var presentToday = await _context.Attendances
        .Where(a => a.Date == today 
                    && a.Status != null 
                    && a.Status == "Present" 
                    && teamEmployeeIds.Contains(a.EmployeeId))
        .Select(a => a.EmployeeId)
        .Distinct()
        .CountAsync();

    // Absent Today
    var absentToday = totalTeam - presentToday;

    // Late Today (safe null check)
    var lateToday = await _context.Attendances
        .Where(a => a.Date == today
                    && a.Status != null
                    && a.Status.Contains("Late")
                    && teamEmployeeIds.Contains(a.EmployeeId))
        .Select(a => a.EmployeeId)
        .Distinct()
        .CountAsync();

    // On Leave Today
    var onLeaveToday = await _context.LeaveApplication
        .Where(l =>
            l.Status == "Approved" &&
            l.StartDate <= today &&
            l.EndDate >= today &&
            teamEmployeeIds.Contains(l.EmployeeId))
        .CountAsync();

    // Upcoming Leaves
    var upcomingLeaves = await _context.LeaveApplication
        .Where(l =>
            l.Status == "Approved" &&
            l.StartDate > today &&
            teamEmployeeIds.Contains(l.EmployeeId))
        .OrderBy(l => l.StartDate)
        .Take(5)
        .Select(l => new
        {
            l.Employee.Name,
            l.StartDate,
            l.EndDate,
            LeaveType = l.LeaveType != null ? l.LeaveType.Name : "Leave"
        })
        .ToListAsync();

    // Team Availability (safe null checks on InTime/OutTime)
    var availability = await _context.Attendances
        .Where(a => a.Date == today && teamEmployeeIds.Contains(a.EmployeeId))
        .Include(a => a.Employee)
        .Select(a => new
        {
            a.Employee.Name,
            Status = a.Status ?? "Unknown",
            InTime = a.InTime != null ? a.InTime.Value.ToString("HH:mm") : "-",
            OutTime = a.OutTime != null ? a.OutTime.Value.ToString("HH:mm") : "-"
        })
        .ToListAsync();

    // Recent Alerts
    var recentAlerts = await _context.Alerts
        .Where(a => teamEmployeeIds.Contains(a.EmployeeId))
        .OrderByDescending(a => a.CreatedAt)
        .Take(5)
        .Select(a => new
        {
            a.Message,
            a.Type,
            Time = a.CreatedAt.ToLocalTime().ToString("g")
        })
        .ToListAsync();

    return Ok(new
    {
        team = supervisor.Team,
        totalTeam,
        presentToday,
        absentToday,
        lateToday,
        onLeaveToday,
        upcomingLeaves,
        availability,
        recentAlerts
    });
}
    [HttpGet("team-attendance")]
public async Task<IActionResult> GetTeamAttendance([FromQuery] DateTime? date)
{
    if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out int userId))
        return Unauthorized(new { message = "Invalid user ID." });

    var supervisor = await _context.Employees
        .FirstOrDefaultAsync(e => e.Id == userId);

    if (supervisor == null || string.IsNullOrEmpty(supervisor.Team))
        return BadRequest(new { message = "Supervisor or team not found." });

    var targetDate = date?.Date ?? DateTime.Today;

    var teamMemberIds = await _context.Employees
        .Where(e => e.Team == supervisor.Team)
        .Select(e => e.Id)
        .ToListAsync();

    var attendance = await _context.Attendances
        .Where(a => teamMemberIds.Contains(a.EmployeeId) && a.Date.Date == targetDate)
        .Include(a => a.Employee)
        .ToListAsync();

    var result = attendance.Select(a => new
    {
        a.EmployeeId,
        EmployeeName = a.Employee.Name,
        Date = a.Date.ToString("yyyy-MM-dd"),
        InTime = a.InTime?.ToString("HH:mm") ?? "-",
        OutTime = a.OutTime?.ToString("HH:mm") ?? "-",
        a.Status
    });

    return Ok(result);
}

}
