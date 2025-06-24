using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using workkeeperApi.Data;
using workkeeperApi.Models;

[Route("employee")]
[ApiController]
public class EmployeeController : ControllerBase
{
    private readonly ApplicationDbContext _employee;

    public EmployeeController(ApplicationDbContext employee)
    {
        _employee = employee;
    }
    [HttpGet]
    public IActionResult GetDashboard()
    {
        return Ok("Employee dashboard data.");
    }
    [HttpGet("data")]
    public async Task<IActionResult> GetEmployees()
    {
        var list = await _employee.Employees.ToListAsync();
        return Ok(list);
    }
    [HttpGet("{id}")]
    public async Task<IActionResult> GetEmployeesById(int id)
    {
        var list = await _employee.Employees.Where(a => a.Id == id).ToListAsync();
        if (list == null)
            return NotFound("Employee not found");

        return Ok(list);
    }
    [HttpPut("update/{id}")]
    public async Task<IActionResult> UpdateEmployee(int id, [FromBody] Employee updatedEmployee)
    {
        // Step 1: Get employee by ID
        var existingEmployee = await _employee.Employees.FindAsync(id);
        if (existingEmployee == null)
            return NotFound("Employee not found");

        // Step 2: Update fields manually
        existingEmployee.Name = updatedEmployee.Name;
        existingEmployee.EmployeeUniqueId = updatedEmployee.EmployeeUniqueId;
        existingEmployee.EmploymentStatus = updatedEmployee.EmploymentStatus;
        existingEmployee.MobileNumber = updatedEmployee.MobileNumber;
        existingEmployee.Email = updatedEmployee.Email;
        existingEmployee.Department = updatedEmployee.Department;
        existingEmployee.Office = updatedEmployee.Office;
        existingEmployee.Team = updatedEmployee.Team;
        existingEmployee.Role = updatedEmployee.Role;
        existingEmployee.EmployeeGroup = updatedEmployee.EmployeeGroup;
        existingEmployee.ExperienceTotalYears = updatedEmployee.ExperienceTotalYears;
        existingEmployee.ShiftId = updatedEmployee.ShiftId;
        existingEmployee.EducationalDetails = updatedEmployee.EducationalDetails;
        existingEmployee.AppraisalDetails = updatedEmployee.AppraisalDetails;

        // Step 3: Save changes
        await _employee.SaveChangesAsync();

        return Ok(existingEmployee);
    }

[HttpGet("dashboard")]
public async Task<IActionResult> GetDashboardData()
{
    var aspNetUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (aspNetUserId == null)
        return Unauthorized("User not logged in");

    var employee = await _employee.Employees
        .Include(e => e.Shift)
        .FirstOrDefaultAsync(e => e.AspNetUsersId == aspNetUserId);

    if (employee == null)
        return NotFound("Employee not found");

    // Get current IST day range (00:00 IST to 23:59:59 IST in UTC)
    TimeZoneInfo ist = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
    var todayIST = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, ist).Date;

    var todayUtcStart = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(todayIST, DateTimeKind.Unspecified), ist);
    var todayUtcEnd = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(todayIST.AddDays(1).AddTicks(-1), DateTimeKind.Unspecified), ist);

    bool isWeekend = todayIST.DayOfWeek == DayOfWeek.Saturday || todayIST.DayOfWeek == DayOfWeek.Sunday;

    var holidayToday = await _employee.Holidays
        .FirstOrDefaultAsync(h => h.HolidayDate >= todayUtcStart && h.HolidayDate <= todayUtcEnd);
    bool isHoliday = holidayToday != null;
    string holidayName = holidayToday?.Name ?? "";

    var todayLogs = await _employee.AttendanceInLog
        .Where(a => a.EmployeeId == employee.Id && a.PunchDateTime >= todayUtcStart && a.PunchDateTime <= todayUtcEnd)
        .OrderBy(a => a.PunchDateTime)
        .ToListAsync();

    var firstPunchIn = todayLogs.FirstOrDefault(l => l.PunchType.ToLower() == "in");
    var lastPunchOut = todayLogs.LastOrDefault(l => l.PunchType.ToLower() == "out");

    var shiftStart = todayUtcStart.Add(employee.Shift.StartTime.ToTimeSpan());
    var shiftEnd = employee.Shift.EndTime < employee.Shift.StartTime
        ? todayUtcStart.AddDays(1).Add(employee.Shift.EndTime.ToTimeSpan())
        : todayUtcStart.Add(employee.Shift.EndTime.ToTimeSpan());

    var expectedHours = (double)employee.Shift.ExpectedHours;
    var breakDuration = employee.Shift.BreakDuration ?? TimeSpan.Zero;

    string mode;
    if (isHoliday)
    {
        mode = "Holiday";
    }
    else if (isWeekend)
    {
        mode = "Weekend";
    }
    else if (firstPunchIn == null && lastPunchOut == null)
    {
        mode = "Absent";
    }
    else
    {
        bool isLate = firstPunchIn != null && firstPunchIn.PunchDateTime > shiftStart.AddMinutes(10);
        bool isEarlyLeave = lastPunchOut != null && lastPunchOut.PunchDateTime < shiftEnd.Subtract(breakDuration).AddMinutes(-10);

        if (isLate && isEarlyLeave)
            mode = "Late & Early";
        else if (isLate)
            mode = "Late Coming";
        else if (isEarlyLeave)
            mode = "Early Leaving";
        else
            mode = "Present";
    }

    double totalHours = 0.00;
    if (firstPunchIn != null && lastPunchOut != null)
    {
        totalHours = (lastPunchOut.PunchDateTime - firstPunchIn.PunchDateTime - breakDuration).TotalHours;
        if (totalHours < 0) totalHours = 0;
    }

    var presence = new
    {
        inTime = firstPunchIn?.PunchDateTime.ToString("o") ?? "N/A",
        outTime = lastPunchOut?.PunchDateTime.ToString("o") ?? "N/A",
        totalHours = totalHours.ToString("0.00"),
        mode,
        isHoliday,
        holidayName,
        isWeekend
    };

    var teamMembers = await _employee.Employees
        .Where(e => e.Team == employee.Team && e.Id != employee.Id)
        .Select(e => e.Name)
        .ToListAsync();

    var todayLeave = await _employee.LeaveApplication
        .Where(l => l.Status == "Approved" && todayUtcStart >= l.StartDate && todayUtcStart <= l.EndDate)
        .Include(l => l.Employee)
        .Select(l => l.Employee.Name)
        .ToListAsync();

    var upcomingStart = todayUtcStart.AddDays(1);
    var upcomingEnd = todayUtcStart.AddDays(7);

    var upcomingLeaves = await _employee.LeaveApplication
        .Where(l => l.Status == "Approved" && l.StartDate >= upcomingStart && l.StartDate <= upcomingEnd)
        .Include(l => l.Employee)
        .Select(l => new { Name = l.Employee.Name, Start = l.StartDate })
        .ToListAsync();

    var upcomingLeaveFormatted = upcomingLeaves
        .Select(l => $"{l.Name} ({l.Start:dd MMM})")
        .ToList();

    // === KPI Calculation ===
    var startOfMonthIST = new DateTime(todayIST.Year, todayIST.Month, 1);
    var endOfMonthIST = startOfMonthIST.AddMonths(1).AddDays(-1);

    var startOfMonthUtc = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(startOfMonthIST, DateTimeKind.Unspecified), ist);
    var endOfMonthUtc = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(endOfMonthIST.AddDays(1).AddTicks(-1), DateTimeKind.Unspecified), ist);

    var monthLogs = await _employee.AttendanceInLog
        .Where(a => a.EmployeeId == employee.Id && a.PunchDateTime >= startOfMonthUtc && a.PunchDateTime <= endOfMonthUtc)
        .ToListAsync();

    var dailySummaries = monthLogs
        .GroupBy(l => TimeZoneInfo.ConvertTimeFromUtc(l.PunchDateTime, ist).Date)
        .Select(group =>
        {
            var inPunch = group
                .Where(l => l.PunchType.ToLower() == "in")
                .OrderBy(l => l.PunchDateTime)
                .FirstOrDefault();
            var outPunch = group
                .Where(l => l.PunchType.ToLower() == "out")
                .OrderByDescending(l => l.PunchDateTime)
                .FirstOrDefault();

            TimeSpan? workDuration = null;
            if (inPunch != null && outPunch != null)
                workDuration = outPunch.PunchDateTime - inPunch.PunchDateTime - breakDuration;

            bool isOnTime = false;
            if (inPunch != null)
                isOnTime = inPunch.PunchDateTime.TimeOfDay <= employee.Shift.StartTime.ToTimeSpan();

            return new
            {
                IsPresent = inPunch != null,
                IsOnTime = isOnTime,
                WorkDuration = workDuration
            };
        })
        .ToList();

    int totalDays = dailySummaries.Count;
    int presentDays = dailySummaries.Count(d => d.IsPresent);
    int onTimeDays = dailySummaries.Count(d => d.IsPresent && d.IsOnTime);
    double totalWorkedHours = dailySummaries.Sum(d => d.WorkDuration?.TotalHours ?? 0);
    double expectedMonthlyHours = totalDays * expectedHours;

    var kpis = new
    {
        productivity = expectedMonthlyHours > 0 ? Math.Round((totalWorkedHours / expectedMonthlyHours) * 100, 1) : 0,
        attendance = totalDays > 0 ? Math.Round((presentDays / (double)totalDays) * 100, 1) : 0,
        punctuality = presentDays > 0 ? Math.Round((onTimeDays / (double)presentDays) * 100, 1) : 0
    };

    return Ok(new
    {
        employeeId = employee.EmployeeUniqueId,
        fullName = employee.Name,
        department = employee.Department,
        team = employee.Team,
        designation = employee.Role,
        presence,
        todayLeave,
        upcomingLeaves = upcomingLeaveFormatted,
        yourTeam = teamMembers,
        kpis
    });
}

    [HttpGet("attendance-summary")]
    [Authorize]
    public async Task<IActionResult> GetAttendanceSummary()
    {
        var aspNetUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (aspNetUserId == null)
            return Unauthorized();

        var employee = await _employee.Employees.FirstOrDefaultAsync(e => e.AspNetUsersId == aspNetUserId);
        if (employee == null)
            return NotFound("Employee not found");

        var now = DateTime.UtcNow.Date;
        var startDate = now.AddDays(-29); // last 30 days

        var logs = await _employee.Attendances
            .Where(a => a.EmployeeId == employee.Id && a.Date >= startDate && a.Date <= now)
            .OrderBy(a => a.Date)
            .ToListAsync();

        var data = logs
            .GroupBy(a => a.Date)
            .Select(g => new
            {
                date = g.Key.ToString("yyyy-MM-dd"),
                totalHours = g.First().TotalHours ?? 0,
                status = g.First().Status ?? "Unknown"
            })
            .ToList();

        return Ok(data);
    }

    [HttpGet("weekly-summary")]
public async Task<IActionResult> GetWeeklySummary()
{
    var aspNetUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (aspNetUserId == null)
        return Unauthorized("User not logged in");

    var employee = await _employee.Employees
        .Include(e => e.Shift)
        .FirstOrDefaultAsync(e => e.AspNetUsersId == aspNetUserId);

    if (employee == null)
        return NotFound("Employee not found");

    var today = DateTime.UtcNow.Date;
    var startDate = today.AddDays(-6); // last 7 days including today
    var logs = await _employee.AttendanceInLog
        .Where(a => a.EmployeeId == employee.Id && a.PunchDateTime.Date >= startDate)
        .OrderBy(a => a.PunchDateTime)
        .ToListAsync();

    var shiftStart = today.Add(employee.Shift.StartTime.ToTimeSpan());
    var shiftEnd = employee.Shift.EndTime < employee.Shift.StartTime
        ? today.AddDays(1).Add(employee.Shift.EndTime.ToTimeSpan())
        : today.Add(employee.Shift.EndTime.ToTimeSpan());

    var holidays = await _employee.Holidays
        .Where(h => h.HolidayDate >= startDate && h.HolidayDate <= today)
        .ToListAsync();

    var result = new List<object>();

    for (int i = 0; i < 7; i++)
    {
        var date = startDate.AddDays(i);
        var dayLogs = logs.Where(l => l.PunchDateTime.Date == date).ToList();

        var inTime = dayLogs.FirstOrDefault(l => l.PunchType == "In")?.PunchDateTime;
        var outTime = dayLogs.LastOrDefault(l => l.PunchType == "Out")?.PunchDateTime;

        string mode = "Absent";
        double totalHours = 0;

        bool isHoliday = holidays.Any(h => h.HolidayDate.Date == date);
        bool isWeekend = date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday;
        var breakDuration = employee.Shift.BreakDuration ?? TimeSpan.Zero;

        if (isHoliday) mode = "Holiday";
        else if (isWeekend) mode = "Weekend";
        else if (inTime != null && outTime != null)
        {
            totalHours = (outTime.Value - inTime.Value - breakDuration).TotalHours;
            if (totalHours < 0) totalHours = 0;

            bool isLate = inTime.Value > date.Add(employee.Shift.StartTime.ToTimeSpan()).AddMinutes(10);
            bool isEarly = outTime.Value < date.Add(employee.Shift.EndTime.ToTimeSpan()).Subtract(breakDuration).AddMinutes(-10);

            if (isLate && isEarly)
                mode = "Late & Early";
            else if (isLate)
                mode = "Late Coming";
            else if (isEarly)
                mode = "Early Leaving";
            else
                mode = "Present";
        }

        result.Add(new
        {
            date = date.ToString("yyyy-MM-dd"),
            day = date.DayOfWeek.ToString().Substring(0, 3),
            inTime = inTime?.ToString("HH:mm") ?? "--:--",
            outTime = outTime?.ToString("HH:mm") ?? "--:--",
            totalHours = totalHours.ToString("0.00"),
            mode
        });
    }

    return Ok(result);
}


    [HttpDelete("delete/{id}")]
    public async Task<IActionResult> DeleteEmployeesById(int id)
    {
        var employeeData = await _employee.Employees.FindAsync(id);
        if (employeeData == null)
            return NotFound("Attendance not found");

        _employee.Employees.Remove(employeeData);
        await _employee.SaveChangesAsync();
        return Ok(employeeData);
    }
    


}
