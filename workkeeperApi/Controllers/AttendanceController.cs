// using System.IdentityModel.Tokens.Jwt;
// using System.IdentityModel.Tokens.Jwt;
using System.Globalization;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using workkeeperApi.Data;
using workkeeperApi.Models;

[ApiController]
[Route("attendance")]
public class AttendanceController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AttendanceController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("employee")]
    public async Task<IActionResult> GetAttendance()
    {
        var list = await _context.Attendances.ToListAsync();
        return Ok(list);
    }

    [HttpGet("findEmployeeByDate")]
    public async Task<IActionResult> GetByEmployeeAndDate(int? employeeId, string? employeeName, DateTime date)
    {
        // Get employeeId if name is given
        if (employeeId == null && !string.IsNullOrEmpty(employeeName))
        {
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.Name.ToLower() == employeeName.ToLower());

            if (employee == null)
                return NotFound("Employee not found by given name.");

            employeeId = employee.Id;
        }

        if (employeeId == null)
            return BadRequest("Provide either employeeId or employeeName.");

        // Assuming CreatedAt is not nullable
        var records = await _context.Attendances
            .Where(a => a.EmployeeId == employeeId &&
                        a.CreatedAt.Date == date.Date)
            .ToListAsync();

        if (records == null || records.Count == 0)
            return NotFound("No records found for the given employee and date.");

        return Ok(records);
    }

    [HttpGet("employee/{id}")]
    public async Task<IActionResult> GetEmployeesAttendanceById(int id, int page = 1, int pageSize = 20)
    {
        var query = _context.AttendanceInLog
            .Where(a => a.EmployeeId == id)
            .OrderByDescending(a => a.PunchDateTime);

        var totalRecords = await query.CountAsync();
        var totalPages = (int)Math.Ceiling((double)totalRecords / pageSize);

        var records = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            TotalRecords = totalRecords,
            TotalPages = totalPages,
            CurrentPage = page,
            Records = records
        });
    }
[HttpGet("lastpunch")]
public async Task<IActionResult> GetLastPunch()
{
    //  Step 1: Get AspNetUserId from claims
    var aspNetUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (aspNetUserId == null)
    {
        return Unauthorized("User not logged in");
    }

    //  Step 2: Resolve EmployeeId
    var employee = await _context.Employees
        .FirstOrDefaultAsync(e => e.AspNetUsersId == aspNetUserId);

    if (employee == null)
    {
        return NotFound(new { message = "Employee not found for this user" });
    }

    var employeeId = employee.Id;

    //  Step 3: Fetch last punch entry
    var lastPunch = await _context.AttendanceInLog
        .Where(a => a.EmployeeId == employeeId)
        .OrderByDescending(a => a.PunchDateTime)
        .FirstOrDefaultAsync();

    if (lastPunch == null)
    {
        return NotFound(new { message = "No punch records found for employee" });
    }

    //  Step 4: Return punch info
    return Ok(new
    {
        lastPunch.PunchType,
        lastPunch.PunchDateTime
    });
}

    [HttpGet("monthly")]
    public IActionResult GetMonthlyAttendance(int employeeId, int month, int year, string? statusFilter = null)
    {
        var start = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = start.AddMonths(1).AddDays(-1);

        var records = _context.AttendanceInLog
            .Where(a => a.EmployeeId == employeeId && a.PunchDateTime.Date >= start.Date && a.PunchDateTime.Date <= end.Date)
            .ToList();

        var result = new List<object>();
        for (var date = start; date <= end; date = date.AddDays(1))
        {
            var record = records.FirstOrDefault(r => r.PunchDateTime.Date == date.Date);

            var status = record != null ? record.Status ?? "Unknown"
                        : (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday) ? "Weekend"
                        : "Absent";

            if (string.IsNullOrEmpty(statusFilter) || status.Equals(statusFilter, StringComparison.OrdinalIgnoreCase))
            {
                result.Add(new
                {
                    date = date.ToString("yyyy-MM-dd"),
                    status
                });
            }
        }

        return Ok(result);
    }


[HttpGet("punchRecords/{employeeId}")]
public async Task<IActionResult> GetPunchRecordsForDate(int employeeId, [FromQuery] string? date = null)
{
    try
    {
        TimeZoneInfo istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
        DateTime punchDate;

        if (string.IsNullOrEmpty(date))
        {
            punchDate = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone).Date;
        }
        else if (!DateTime.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out punchDate))
        {
            return BadRequest(new { message = "Invalid date format. Use yyyy-MM-dd." });
        }

        //  Convert IST to UTC using proper DateTimeKind
        DateTime istStartLocal = punchDate.Date;
        DateTime istEndLocal = punchDate.Date.AddDays(1).AddTicks(-1);

        DateTime istStart = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(istStartLocal, DateTimeKind.Unspecified), istZone);
        DateTime istEnd = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(istEndLocal, DateTimeKind.Unspecified), istZone);

        var punches = await _context.AttendanceInLog
            .Where(a => a.EmployeeId == employeeId &&
                        a.PunchDateTime >= istStart && a.PunchDateTime <= istEnd)
            .OrderBy(a => a.PunchDateTime)
            .ToListAsync();

        var punchInTimes = punches
            .Where(p => p.PunchType.Equals("in", StringComparison.OrdinalIgnoreCase))
            .Select(p => p.PunchDateTime)
            .ToList();

        var punchOutTimes = punches
            .Where(p => p.PunchType.Equals("out", StringComparison.OrdinalIgnoreCase))
            .Select(p => p.PunchDateTime)
            .ToList();

        var result = new
        {
            Date = punchDate.ToString("yyyy-MM-dd"),
            PunchInCount = punchInTimes.Count,
            PunchOutCount = punchOutTimes.Count,
            FirstPunchIn = punchInTimes.Any() ? punchInTimes.Min().ToString("HH:mm:ss") : null,
            LastPunchOut = punchOutTimes.Any() ? punchOutTimes.Max().ToString("HH:mm:ss") : null,
            PunchInTimes = punchInTimes.Select(t => t.ToString("HH:mm:ss")).ToList(),
            PunchOutTimes = punchOutTimes.Select(t => t.ToString("HH:mm:ss")).ToList()
        };

        return Ok(result);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { message = "Error retrieving punch records", error = ex.Message });
    }
}
    [HttpGet("myattendance")]
    [Authorize]
    public async Task<IActionResult> GetMyAttendance(int month, int year)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized("Employee not found in token.");

        var employee = await _context.Employees
            .Include(e => e.AspNetUser)
            .FirstOrDefaultAsync(e => e.AspNetUsersId == userId);

        if (employee == null)
            return NotFound("Employee not found.");

        var start = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(year, month, DateTime.DaysInMonth(year, month), 0, 0, 0, DateTimeKind.Utc);
        var today = DateTime.UtcNow.Date;

        var records = await _context.AttendanceInLog
            .Where(a => a.EmployeeId == employee.Id && a.PunchDateTime.Date >= start.Date && a.PunchDateTime.Date <= today)
            .ToListAsync();

        var holidays = await _context.Holidays
            .Where(h => h.HolidayDate.Date >= start.Date && h.HolidayDate.Date <= end.Date)
            .ToListAsync();

        var result = new List<object>();

        for (var date = start; date <= end; date = date.AddDays(1))
        {
            var punches = records.Where(a => a.PunchDateTime.Date == date.Date).OrderBy(a => a.PunchDateTime).ToList();
            var punchIn = punches.FirstOrDefault(p => p.PunchType == "In");
            var punchOut = punches.LastOrDefault(p => p.PunchType == "Out");

            var attendanceRecord = await _context.Attendances.FirstOrDefaultAsync(a => a.EmployeeId == employee.Id && a.Date.Date == date.Date);


            var status = holidays.Any(h => h.HolidayDate.Date == date.Date) ? "Holiday"
                       : date > today ? "Upcoming"
                       : date.DayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday ? "Weekend"
                       : punches.Any() ? "Present" : "Absent";

            var source = status == "Holiday" ? "HolidayTable"
                        : status == "Weekend" ? "Weekend"
                        : status == "Upcoming" ? "Future"
                        : punches.Any() ? "Attendance" : "None";

            var Id = attendanceRecord?.Id;

            result.Add(new
            {
                Id,
                Date = date.ToString("yyyy-MM-dd"),
                DateObject = date,
                Status = status,
                Source = source,
                PunchIn = punchIn?.PunchDateTime.ToString("HH:mm"),
                PunchOut = punchOut?.PunchDateTime.ToString("HH:mm"),
                PunchInDateTime = punchIn?.PunchDateTime,
                PunchOutDateTime = punchOut?.PunchDateTime,
                IsHoliday = status == "Holiday",
                IsWeekend = status == "Weekend",
                IsFuture = status == "Upcoming"
            });
        }

        return Ok(new
        {
            EmployeeId = employee.Id,
            EmployeeName = employee.Name,
            UserId = employee.AspNetUser?.UserName,
            Month = month,
            Year = year,
            GeneratedAt = DateTime.UtcNow,
            AttendanceCalendar = result
        });
    }
[HttpPost("TakeAttendance")]
public async Task<IActionResult> MarkAttendance([FromBody] AttendanceRequestModel model)
{
    // ✅ Get AspNetUserId from identity cookie
    var aspNetUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (aspNetUserId == null)
        return Unauthorized("User not logged in");

    // ✅ Fetch Employee by AspNetUserId
    var employee = await _context.Employees
        .FirstOrDefaultAsync(e => e.AspNetUsersId == aspNetUserId);

    if (employee == null)
        return NotFound("Employee not found");

    var employeeId = employee.Id;

    // ✅ Fetch current shiftId
        
    if (employee.ShiftId == null || employee.ShiftId == 0)
        return NotFound("Shift not assigned to employee");

    int shiftId = (int)employee.ShiftId;

    var now = DateTime.UtcNow;
    var today = now.Date;

    // ✅ Fetch today's punches
    var todayPunches = await _context.AttendanceInLog
        .Where(a => a.EmployeeId == employeeId &&
                    a.ShiftId == shiftId &&
                    a.PunchDateTime.Date == today)
        .OrderBy(a => a.PunchDateTime)
        .ToListAsync();

    var lastPunch = todayPunches.LastOrDefault();
    var lastType = lastPunch?.PunchType?.ToLower();

    Console.WriteLine($"Last Punch: {lastPunch?.PunchDateTime}, Type: {lastType}");
    Console.WriteLine($"Current Time (now): {now}");

    // ✅ Handle time skew
    if (lastPunch != null)
    {
        var timeDiff = (now - lastPunch.PunchDateTime).TotalSeconds;

        if (timeDiff < -21600)
        {
            return BadRequest($"⛔ Your system time is behind last punch time. Please sync your clock.");
        }

        if (timeDiff >= 0 && timeDiff < 5)
        {
            return BadRequest($"⚠️ You just punched {lastPunch.PunchType} {Math.Round(timeDiff, 1)} secs ago.");
        }

        if (timeDiff < 0 && timeDiff > -1600)
        {
            Console.WriteLine($"⚠️ Clock is behind by {Math.Round(-timeDiff)} secs, allowing punch.");
        }
    }

    // ✅ Toggle punch type
    string newPunchType = lastType == "in" ? "Out" : "In";
    


    var attendance = new AttendanceInLog
    {
        EmployeeId = employeeId,
        ShiftId = shiftId,
        PunchType = newPunchType,
        PunchDateTime = now,
        Source = (SourceEnum)model.Source,
        CreatedAt = now
    };

    _context.AttendanceInLog.Add(attendance);
    await _context.SaveChangesAsync();

    // ✅ Return updated punches
    var updatedTodayPunches = await _context.AttendanceInLog
        .Where(a => a.EmployeeId == employeeId &&
                    a.ShiftId == shiftId &&
                    a.PunchDateTime.Date == today)
        .OrderBy(a => a.PunchDateTime)
        .ToListAsync();

    Console.WriteLine($"✅ Updated Punches: {string.Join(", ", updatedTodayPunches.Select(p => $"{p.PunchType}: {p.PunchDateTime}"))}");

    return Ok(new
    {
        message = $"Punched {newPunchType} successfully.",
        attendance,
        todayPunches = updatedTodayPunches
    });
}
    [HttpPut("update/{id}")]
    public async Task<IActionResult> UpdateAttendance(int id, [FromBody] EditAttendanceDto model)
    {
        var attendance = await _context.Attendances.FindAsync(id);
        if (attendance == null)
            return NotFound($"Attendance record with ID {id} not found.");

        if (model.InTime.HasValue && model.OutTime.HasValue && model.OutTime <= model.InTime)
            return BadRequest("OutTime must be after InTime.");


        attendance.InTime = model.InTime?.ToUniversalTime();
        attendance.OutTime = model.OutTime?.ToUniversalTime();

        if (attendance.InTime.HasValue && attendance.OutTime.HasValue)
        {
            attendance.TotalHours = (decimal)(attendance.OutTime.Value - attendance.InTime.Value).TotalHours;
        }

        var editorRole = User.IsInRole("Admin") ? "admin" :
                        User.IsInRole("Supervisor") ? "supervisor" : "employee";
        var editorName = User.Identity?.Name ?? "System";

        attendance.EditedBy = $"{editorRole} ({editorName})";
        attendance.UpdatedAt = DateTime.UtcNow;

        //  Add Alert for the employee
        _context.Alerts.Add(new Alert
        {
            EmployeeId = attendance.EmployeeId,
            Message = $"Your attendance on {attendance.Date:yyyy-MM-dd} was updated by {editorRole} ({editorName}).",
            Type = "Attendance",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(new { message = "Attendance updated successfully", attendance });
    }




    [HttpDelete("delete/{id}")]
    public async Task<IActionResult> DeleteEmployeesById(int id)
    {
        var attendance = await _context.Attendances.FindAsync(id);
        if (attendance == null)
            return NotFound("Attendance not found");

        _context.Attendances.Remove(attendance);
        await _context.SaveChangesAsync();
        return Ok("Attendance deleted");
    }


    [HttpGet("export")]
    public async Task<IActionResult> ExportAttendance([FromQuery] int month, [FromQuery] int year)
    {
        try
        {
            if (month < 1 || month > 12 || year < 2000)
                return BadRequest("Invalid month or year.");

            // === Get logged-in user's AspNet ID ===
            var aspNetUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(aspNetUserId))
                return Unauthorized("User not logged in.");

            // === Get corresponding Employee ===
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.AspNetUsersId == aspNetUserId);
            if (employee == null)
                return Unauthorized("No employee record linked to this user.");

            var employeeId = employee.Id;

            // === Set UTC date range for PostgreSQL compatibility ===
            var startDate = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDate = startDate.AddMonths(1).AddDays(-1);

            // === Get this employee’s logs only ===
            var logs = await _context.AttendanceInLog
                .Include(a => a.Employee)
                .Include(a => a.Shift)
                .Where(a => a.EmployeeId == employeeId &&
                            a.PunchDateTime >= startDate &&
                            a.PunchDateTime <= endDate)
                .ToListAsync();

            if (!logs.Any())
                return NotFound("No attendance logs found for this month.");

            // === Group logs by date ===
            var grouped = logs
                .GroupBy(a => a.PunchDateTime.Date)
                .Select(g =>
                {
                    var emp = g.FirstOrDefault()?.Employee;
                    var shift = g.FirstOrDefault()?.Shift;

                    var punches = g.OrderBy(p => p.PunchDateTime).ToList();
                    var firstIn = punches.FirstOrDefault(p => p.PunchType.ToLower() == "in");
                    var lastOut = punches.LastOrDefault(p => p.PunchType.ToLower() == "out");

                    string status;
                    if (firstIn != null && lastOut != null)
                        status = "Present";
                    else if (punches.Count == 0)
                        status = "Absent";
                    else
                        status = "Partial";

                    var totalHours = 0.0;
                    if (firstIn != null && lastOut != null)
                    {
                        totalHours = (lastOut.PunchDateTime - firstIn.PunchDateTime).TotalHours;
                        if (shift?.BreakDuration != null)
                            totalHours -= shift.BreakDuration.Value.TotalHours;
                    }

                    return new
                    {
                        EmployeeId = emp?.Id ?? 0,
                        EmployeeName = emp?.Name ?? "Unknown",
                        Date = g.Key.ToString("yyyy-MM-dd"),
                        InTime = firstIn?.PunchDateTime.ToString("HH:mm") ?? "",
                        OutTime = lastOut?.PunchDateTime.ToString("HH:mm") ?? "",
                        Status = status,
                        ShiftName = shift?.Name ?? "N/A",
                        TotalHours = Math.Round(totalHours, 2),
                        Source = firstIn?.Source.ToString() ?? "",
                        IsManual = g.Any(x => x.Source == SourceEnum.hr_manual),
                        EditedBy = g.FirstOrDefault(x => !string.IsNullOrEmpty(x.EditedBy))?.EditedBy ?? ""
                    };
                })
                .OrderBy(r => r.Date)
                .ToList();

            // === Generate CSV ===
            var csv = new StringBuilder();
            csv.AppendLine("EmployeeID,EmployeeName,Date,InTime,OutTime,Status,ShiftName,TotalHours,Source,IsManual,EditedBy");

            foreach (var row in grouped)
            {
                csv.AppendLine($"{row.EmployeeId},{row.EmployeeName},{row.Date},{row.InTime},{row.OutTime},{row.Status},{row.ShiftName},{row.TotalHours},{row.Source},{row.IsManual},{row.EditedBy}");
            }

            var bytes = Encoding.UTF8.GetBytes(csv.ToString());
            return File(bytes, "text/csv", $"AttendanceExport_{month}_{year}.csv");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Server error: {ex.Message}");
        }
    }

[HttpGet("summary")]
public async Task<IActionResult> GetAttendanceSummary([FromQuery] DateTime? date, [FromQuery] int? month, [FromQuery] int? year)
{
    try
    {
        var aspNetUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (aspNetUserId == null)
            return Unauthorized("User not logged in.");

        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.AspNetUsersId == aspNetUserId);
        if (employee == null)
            return Unauthorized("Employee not found.");

        var employeeId = employee.Id;

        //  1. Daily Summary
        if (date.HasValue)
        {
            var targetDate = DateTime.SpecifyKind(date.Value.Date, DateTimeKind.Utc);
            var punches = await _context.AttendanceInLog
                .Include(p => p.Shift)
                .Where(p => p.EmployeeId == employeeId && p.PunchDateTime.Date == targetDate)
                .OrderBy(p => p.PunchDateTime)
                .ToListAsync();

            var shift = punches.FirstOrDefault()?.Shift;
            var expectedMinutes = (double)((shift?.ExpectedHours ?? 8) * 60);
            var breakMinutes = shift?.BreakDuration.HasValue == true
                ? shift.BreakDuration.Value.TotalMinutes
                : 60.0;

            var firstIn = punches.FirstOrDefault(p => p.PunchType.ToLower() == "in");
            var lastOut = punches.LastOrDefault(p => p.PunchType.ToLower() == "out");

            string status = punches.Count == 0 ? "Absent" :
                (firstIn != null && lastOut != null) ? "Present" : "Partial";

            var workingMinutes = (firstIn != null && lastOut != null)
                ? (lastOut.PunchDateTime - firstIn.PunchDateTime).TotalMinutes
                : 0;

            var netWorking = workingMinutes - breakMinutes;
            var overtime = netWorking > expectedMinutes ? netWorking - expectedMinutes : 0;

            return Ok(new
            {
                date = targetDate.ToString("yyyy-MM-dd"),
                employeeId = employee.Id,
                employeeName = employee.Name,
                status,
                inTime = firstIn?.PunchDateTime.ToString("HH:mm") ?? "",
                outTime = lastOut?.PunchDateTime.ToString("HH:mm") ?? "",
                totalWorkingMinutes = (int)Math.Round(workingMinutes),
                breakMinutes = (int)Math.Round(breakMinutes),
                netWorkingMinutes = (int)Math.Round(netWorking),
                overtimeMinutes = (int)Math.Round(overtime)
            });
        }

        //  2. Monthly Summary
        if (month.HasValue && year.HasValue)
        {
            var startDate = new DateTime(year.Value, month.Value, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDate = startDate.AddMonths(1).AddDays(-1);

            var allWeekdays = Enumerable.Range(0, (endDate - startDate).Days + 1)
                .Select(offset => startDate.AddDays(offset))
                .Where(d => d.DayOfWeek != DayOfWeek.Saturday && d.DayOfWeek != DayOfWeek.Sunday)
                .ToList();

            var holidays = await _context.Holidays
                .Where(h => h.HolidayDate >= startDate && h.HolidayDate <= endDate)
                .Select(h => h.HolidayDate.Date)
                .ToListAsync();

            var logs = await _context.AttendanceInLog
                .Where(a => a.EmployeeId == employeeId &&
                            a.PunchDateTime >= startDate &&
                            a.PunchDateTime <= endDate)
                .ToListAsync();

            var grouped = logs
                .GroupBy(l => l.PunchDateTime.Date)
                .ToDictionary(g => g.Key, g => g.ToList());

            int present = 0, absent = 0, partial = 0, wfh = 0;
            double totalHours = 0;

            foreach (var day in allWeekdays)
            {
                if (holidays.Contains(day.Date)) continue;

                if (grouped.TryGetValue(day.Date, out var punches))
                {
                    var firstIn = punches.FirstOrDefault(p => p.PunchType.ToLower() == "in");
                    var lastOut = punches.LastOrDefault(p => p.PunchType.ToLower() == "out");

                    if (punches.Any(p => p.Status.ToLower() == "wfh")) wfh++;

                    if (firstIn != null && lastOut != null)
                    {
                        present++;
                        totalHours += (lastOut.PunchDateTime - firstIn.PunchDateTime).TotalHours;
                    }
                    else
                    {
                        partial++;
                    }
                }
                else
                {
                    absent++;
                }
            }

            return Ok(new
            {
                month = month.Value,
                year = year.Value,
                employeeId = employee.Id,
                employeeName = employee.Name,
                presentDays = present,
                absentDays = absent,
                partialDays = partial,
                workFromHomeDays = wfh,
                holidays = holidays.Count,
                totalWorkingDays = allWeekdays.Count - holidays.Count,
                totalHoursWorked = Math.Round(totalHours, 2)
            });
        }

        //  3. Yearly Summary
        if (year.HasValue && !month.HasValue && !date.HasValue)
        {
            var yearlySummary = new List<object>();

            for (int m = 1; m <= 12; m++)
            {
                var start = new DateTime(year.Value, m, 1, 0, 0, 0, DateTimeKind.Utc);
                var end = start.AddMonths(1).AddDays(-1);

                var allWeekdays = Enumerable.Range(0, (end - start).Days + 1)
                    .Select(offset => start.AddDays(offset))
                    .Where(d => d.DayOfWeek != DayOfWeek.Saturday && d.DayOfWeek != DayOfWeek.Sunday)
                    .ToList();

                var holidays = await _context.Holidays
                    .Where(h => h.HolidayDate >= start && h.HolidayDate <= end)
                    .Select(h => h.HolidayDate.Date)
                    .ToListAsync();

                var logs = await _context.AttendanceInLog
                    .Where(a => a.EmployeeId == employeeId &&
                                a.PunchDateTime >= start &&
                                a.PunchDateTime <= end)
                    .ToListAsync();

                var grouped = logs
                    .GroupBy(l => l.PunchDateTime.Date)
                    .ToDictionary(g => g.Key, g => g.ToList());

                int present = 0, absent = 0, partial = 0, wfh = 0;
                double totalHours = 0;

                foreach (var day in allWeekdays)
                {
                    if (holidays.Contains(day.Date)) continue;

                    if (grouped.TryGetValue(day.Date, out var punches))
                    {
                        var firstIn = punches.FirstOrDefault(p => p.PunchType.ToLower() == "in");
                        var lastOut = punches.LastOrDefault(p => p.PunchType.ToLower() == "out");

                        if (punches.Any(p => p.Status.ToLower() == "wfh")) wfh++;

                        if (firstIn != null && lastOut != null)
                        {
                            present++;
                            totalHours += (lastOut.PunchDateTime - firstIn.PunchDateTime).TotalHours;
                        }
                        else
                        {
                            partial++;
                        }
                    }
                    else
                    {
                        absent++;
                    }
                }

                yearlySummary.Add(new
                {
                    month = m,
                    presentDays = present,
                    absentDays = absent,
                    partialDays = partial,
                    workFromHomeDays = wfh,
                    holidays = holidays.Count,
                    totalWorkingDays = allWeekdays.Count - holidays.Count,
                    totalHoursWorked = Math.Round(totalHours, 2)
                });
            }

            return Ok(new
            {
                year = year.Value,
                employeeId = employee.Id,
                employeeName = employee.Name,
                months = yearlySummary
            });
        }

        return BadRequest("Invalid query: provide either ?date=, or ?month=&year=, or ?year=");
    }
    catch (Exception ex)
    {
        return StatusCode(500, $"Server error: {ex.Message}");
    }
}

    [HttpPost("check-live-missed-punchout")]
    public async Task<IActionResult> CheckLivePunchOut()
    {
        var aspNetUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (aspNetUserId == null) return Unauthorized();

        var employee = await _context.Employees
            .Include(e => e.Shift)
            .FirstOrDefaultAsync(e => e.AspNetUsersId == aspNetUserId);

        if (employee == null || employee.Shift == null) return NotFound("Employee or shift not found");

        var today = DateTime.UtcNow.Date;
        var shiftEndTime = DateTime.SpecifyKind(
            today.Add(employee.Shift.EndTime.ToTimeSpan()),
            DateTimeKind.Utc
        );
        var now = DateTime.UtcNow;

        // Get today's attendance
        var attendance = await _context.Attendances
            .FirstOrDefaultAsync(a => a.EmployeeId == employee.Id && a.Date == today);

        if (attendance?.InTime != null && attendance.OutTime == null && now > shiftEndTime)
        {
            // Check if alert already exists to avoid duplicates
            var exists = await _context.Alerts.AnyAsync(a =>
                a.EmployeeId == employee.Id &&
                a.Type == "Attendance" &&
                a.Message.Contains($"You forgot to punch out on {today:yyyy-MM-dd}")
            );

            if (!exists)
            {
                _context.Alerts.Add(new Alert
                {
                    EmployeeId = employee.Id,
                    Message = $"You forgot to punch out on {today:yyyy-MM-dd}. Please correct it.",
                    Type = "Attendance",
                    CreatedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();
            }

            return Ok(new { alertCreated = !exists, message = "Alert added for missed punch out." });
        }

        return Ok(new { alertCreated = false, message = "No alert needed." });
    }
    public class AttendanceEditRequest
    {
        public string PunchType { get; set; } = string.Empty;
        public DateTime PunchDateTime { get; set; }
        public SourceEnum Source { get; set; }
        public string Status { get; set; } = string.Empty;
    }


    [HttpPut("edit/{id}")]
    [Authorize(Roles = "admin,supervisor")]
    public async Task<IActionResult> EditAttendance(int id, [FromBody] AttendanceEditRequest model)
    {
        // Step 1: Get current user ID from cookie-authenticated session
        var aspNetUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (aspNetUserId == null)
            return Unauthorized("Login session expired.");

        // Step 2: Fetch employee record of the editor (admin/supervisor)
        var editor = await _context.Employees.FirstOrDefaultAsync(e => e.AspNetUsersId == aspNetUserId);
        if (editor == null)
            return Unauthorized("Editor (admin/supervisor) not found in employee records.");

        // Step 3: Fetch the existing attendance log
        var attendance = await _context.AttendanceInLog.FindAsync(id);
        if (attendance == null)
            return NotFound("Attendance entry not found.");

        // Step 4: Update the editable fields
        attendance.PunchDateTime = model.PunchDateTime.ToUniversalTime();
        attendance.PunchType = model.PunchType;
        attendance.Source = model.Source;
        attendance.Status = model.Status;
        attendance.UpdatedAt = DateTime.UtcNow;
        attendance.EditedBy = editor.Name;

        _context.AttendanceInLog.Update(attendance);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Attendance updated successfully.",
            attendance
        });
    }

}
    // [HttpPut("UpdateAttendance/{id}")]
    // public async Task<IActionResult> UpdateAttendance(int id, [FromBody] AttendanceInLog model)
    // {
    //     // try
    //     // {
    //         // Step 1: Fetch existing punch log
    //         var attendanceLog = await _context.AttendanceInLog.FindAsync(id);
    //         if (attendanceLog == null)
    //             return NotFound($"Attendance log with ID {id} not found.");

    //         // Step 2: Update punch log details
    //         attendanceLog.PunchType = model.PunchType;
    //         attendanceLog.PunchDateTime = model.PunchDateTime.Kind == DateTimeKind.Unspecified 
    //             ? DateTime.SpecifyKind(model.PunchDateTime, DateTimeKind.Utc)
    //             : model.PunchDateTime.ToUniversalTime();
    //         attendanceLog.Source = model.Source;

    //         // Step 3: Determine editor info
    //         var editorRole = User.IsInRole("Admin") ? "admin"
    //                         : User.IsInRole("Supervisor") ? "supervisor"
    //                         : "employee";
    //         var editorName = User.Identity?.Name ?? "System";

    //         attendanceLog.EditedBy = $"{editorRole} ({editorName})";
    //         attendanceLog.UpdatedAt = DateTime.UtcNow;

    //         // Save updated log
    //         await _context.SaveChangesAsync();

    //         // Step 4: Recalculate summary
    //         var employeeId = attendanceLog.EmployeeId;
    //         var date = attendanceLog.PunchDateTime.Date;

    //         var punchLogs = await _context.AttendanceInLog
    //             .Where(log => log.EmployeeId == employeeId && log.PunchDateTime.Date == date)
    //             .OrderBy(log => log.PunchDateTime)
    //             .ToListAsync();

    //         if (punchLogs.Any())
    //         {
    //             var attendanceSummary = await _context.Attendances
    //                 .FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.Date == date);

    //             if (attendanceSummary == null)
    //             {
    //                 attendanceSummary = new Attendance
    //                 {
    //                     EmployeeId = employeeId,
    //                     Date = date,
    //                     ShiftId = punchLogs.First().ShiftId,
    //                     CreatedAt = DateTime.UtcNow,
    //                     IsManual = false,
    //                     // PunchStatus = PunchStatus.success // Default value
    //                 };
    //                 _context.Attendances.Add(attendanceSummary);
    //             }

    //             // Handle time conversion
    //             attendanceSummary.InTime = punchLogs.First().PunchDateTime.Kind == DateTimeKind.Unspecified 
    //                 ? DateTime.SpecifyKind(punchLogs.First().PunchDateTime, DateTimeKind.Utc)
    //                 : punchLogs.First().PunchDateTime.ToUniversalTime();

    //             attendanceSummary.OutTime = punchLogs.Last().PunchDateTime.Kind == DateTimeKind.Unspecified 
    //                 ? DateTime.SpecifyKind(punchLogs.Last().PunchDateTime, DateTimeKind.Utc)
    //                 : punchLogs.Last().PunchDateTime.ToUniversalTime();

    //             // Calculate hours
    //             if (attendanceSummary.InTime.HasValue && attendanceSummary.OutTime.HasValue)
    //             {
    //                 attendanceSummary.TotalHours = (decimal)(attendanceSummary.OutTime.Value - attendanceSummary.InTime.Value).TotalHours;
    //             }

    //             // attendanceSummary.Status = AttendanceStatus.valid;
    //             attendanceSummary.EditedBy = $"{editorRole} ({editorName})";
    //             attendanceSummary.UpdatedAt = DateTime.UtcNow;

    //             await _context.SaveChangesAsync();
    //         }

    //         return Ok(new
    //         {
    //             message = "Attendance updated successfully",
    //             attendanceLog
    //         });
    // }
    // catch (Exception ex)
    // {
    //     return StatusCode(500, $"An error occurred: {ex.Message}");
    // }
    // }

    // [HttpPut("update/{id}")]
    // public async Task<IActionResult> UpdateAttendance(int id, [FromBody] EditAttendanceDto model)
    // {
    //     var attendance = await _context.Attendances.FindAsync(id);
    //     if (attendance == null)
    //         return NotFound($"Attendance record with ID {id} not found.");

    //     if (model.InTime.HasValue && model.OutTime.HasValue && model.OutTime <= model.InTime)
    //         return BadRequest("OutTime must be after InTime.");

    //     attendance.InTime = model.InTime?.ToUniversalTime();
    //     attendance.OutTime = model.OutTime?.ToUniversalTime();

    //     if (attendance.InTime.HasValue && attendance.OutTime.HasValue)
    //     {
    //         attendance.TotalHours = (decimal)(attendance.OutTime.Value - attendance.InTime.Value).TotalHours;
    //     }

    //     var editorRole = User.IsInRole("Admin") ? "admin" :
    //                      User.IsInRole("Supervisor") ? "supervisor" : "employee";
    //     var editorName = User.Identity?.Name ?? "System";

    //     attendance.EditedBy = $"{editorRole} ({editorName})";
    //     attendance.UpdatedAt = DateTime.UtcNow;

    //     await _context.SaveChangesAsync();
    //     return Ok(new { message = "Attendance updated successfully", attendance });
    // }

    // [HttpDelete("delete/{id}")]
    // public async Task<IActionResult> DeleteEmployeesById(int id)
    // {
    //     var attendance = await _context.Attendances.FindAsync(id);
    //     if (attendance == null)
    //         return NotFound("Attendance not found");

    //     _context.Attendances.Remove(attendance);
    //     await _context.SaveChangesAsync();
    //     return Ok("Attendance deleted");
    // }
// }
