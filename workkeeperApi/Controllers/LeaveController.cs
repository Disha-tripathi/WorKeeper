using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using workkeeperApi.Data;
using workkeeperApi.Mail;
using workkeeperApi.Models;

[ApiController]
[Route("leave")]
public class LeaveController : ControllerBase
{
    private readonly ApplicationDbContext _leaves;
    private readonly IMailService _mailService;

    public LeaveController(ApplicationDbContext leaves, IMailService mailService)
    {
        _leaves = leaves;
        _mailService = mailService;
    }

    // 1. Apply for Leave
    [HttpPost("apply")]
    public async Task<IActionResult> ApplyLeave(LeaveRequest request)
    {
        int totalDays = (int)((request.EndDate.Date - request.StartDate.Date).TotalDays + 1);
        var startDateUtc = request.StartDate.ToUniversalTime();
        var endDateUtc = request.EndDate.ToUniversalTime();

        var leaveBalance = await _leaves.EmployeeLeavePolicy
            .FirstOrDefaultAsync(x => x.EmployeeId == request.EmployeeId && x.LeaveTypeId == request.LeaveTypeId);

        if (leaveBalance == null)
            return BadRequest("Leave balance not found.");

        int lossOfPayDays = 0;

        if (totalDays > leaveBalance.OpeningBalance)
        {
            lossOfPayDays = totalDays - (int)leaveBalance.OpeningBalance;
            totalDays = (int)leaveBalance.OpeningBalance;
        }

        var leave = new LeaveApplication
        {
            EmployeeId = request.EmployeeId,
            LeaveTypeId = request.LeaveTypeId,
            StartDate = startDateUtc,
            EndDate = endDateUtc,
            Status = "Pending",
            AppliedOn = DateTime.UtcNow,
            Note = request.Note,
            CreatedAt = DateTime.UtcNow
        };

        _leaves.LeaveApplication.Add(leave);

        if (lossOfPayDays > 0)
        {
            var lopType = await _leaves.LeaveType.FirstOrDefaultAsync(x => x.Name == "Loss of Pay (LOP)");
            if (lopType != null)
            {
                var lopLeave = new LeaveApplication
                {
                    EmployeeId = request.EmployeeId,
                    LeaveTypeId = lopType.Id,
                    StartDate = startDateUtc.AddDays(totalDays),
                    EndDate = endDateUtc,
                    Status = "Pending",
                    AppliedOn = DateTime.UtcNow,
                    Note = $"Extra days beyond balance marked as Loss of Pay.",
                    CreatedAt = DateTime.UtcNow
                };
                _leaves.LeaveApplication.Add(lopLeave);
            }
        }

        var hasOverlap = await _leaves.LeaveApplication.AnyAsync(l =>
            l.EmployeeId == request.EmployeeId &&
            l.LeaveTypeId == request.LeaveTypeId &&
            l.Status != "Rejected" &&
            (
                (startDateUtc >= l.StartDate && startDateUtc <= l.EndDate) ||
                (endDateUtc >= l.StartDate && endDateUtc <= l.EndDate) ||
                (startDateUtc <= l.StartDate && endDateUtc >= l.EndDate)
            )
        );

        if (hasOverlap)
            return BadRequest("You already have a leave applied during this period.");

        await _leaves.SaveChangesAsync(); // save the leave first

        var approvers = await _leaves.Employees
            .Where(e => e.Role == "Admin" || e.Role == "Supervisor")
            .ToListAsync();

        foreach (var approver in approvers)
        {
            _leaves.Alerts.Add(new Alert
            {
                EmployeeId = approver.Id,
                Message = $"New leave request submitted by Employee ID {request.EmployeeId} from {request.StartDate:yyyy-MM-dd} to {request.EndDate:yyyy-MM-dd}.",
                Type = "Leave",
                CreatedAt = DateTime.UtcNow
            });
        }

        // 📨 Send Email to Admin with Approve/Reject links
        var savedLeave = await _leaves.LeaveApplication
            .Where(l => l.EmployeeId == request.EmployeeId &&
                        l.LeaveTypeId == request.LeaveTypeId &&
                        l.StartDate == startDateUtc &&
                        l.EndDate == endDateUtc &&
                        l.Status == "Pending")
            .OrderByDescending(l => l.Id)
            .FirstOrDefaultAsync();

        if (savedLeave == null)
            return StatusCode(500, "Leave saved but could not generate email.");

        string baseUrl = "http://localhost:5173"; // 🌐 change when deployed
        string approveUrl = $"{baseUrl}/leave/approve/{savedLeave.Id}?approverId=4";
        string rejectUrl = $"{baseUrl}/reject/{savedLeave.Id}";

        string adminEmail = "workkeeper71@gmail.com";
        string subject = $"Leave Request from Employee ID: {request.EmployeeId}";
        string body = $@"
            <p>New leave application received.</p>
            <p><strong>Employee ID:</strong> {request.EmployeeId}</p>
            <p><strong>Leave Type ID:</strong> {request.LeaveTypeId}</p>
            <p><strong>From:</strong> {request.StartDate:yyyy-MM-dd}</p>
            <p><strong>To:</strong> {request.EndDate:yyyy-MM-dd}</p>
            <p><strong>Note:</strong> {request.Note}</p>
            <br/>
            <p>
                <a href='{approveUrl}' style='color: green;'>✅ Approve</a> |
                <a href='{rejectUrl}' style='color: red;'>❌ Reject</a>
            </p>
            <br/>
            <p>Check admin panel for details.</p>
        ";

        await _mailService.SendEmailAsync(adminEmail, subject, body);
        await _leaves.SaveChangesAsync(); //save the alerts

        return Ok(new { message = "Leave applied successfully. Email sent to admin." });
    }

    // 2. Approve Leave
    [HttpPut("approve/{id}")]
    public async Task<IActionResult> ApproveLeave(int id, [FromQuery] int approverId)
    {
        var leave = await _leaves.LeaveApplication.FindAsync(id);
        if (leave == null) return NotFound("Leave not found");
        if (leave.Status != "Pending") return BadRequest("Already processed.");

        var approver = await _leaves.Employees
            .FirstOrDefaultAsync(u => u.Id == approverId && (u.Role == "Admin" || u.Role == "Supervisor"));

        if (approver == null)
            return BadRequest("Only Admin or Supervisor can approve.");

        leave.StartDate = DateTime.SpecifyKind(leave.StartDate.Date, DateTimeKind.Utc);
        leave.EndDate = DateTime.SpecifyKind(leave.EndDate.Date, DateTimeKind.Utc);
        leave.Status = "Approved";
        leave.ApprovedBy = approverId;
        leave.ApprovedOn = DateTime.UtcNow;

        _leaves.LeaveApplication.Update(leave);

        _leaves.Alerts.Add(new Alert
        {
            EmployeeId = leave.EmployeeId,
            Message = $"Your leave from {leave.StartDate:yyyy-MM-dd} to {leave.EndDate:yyyy-MM-dd} was approved.",
            Type = "Leave",
            CreatedAt = DateTime.UtcNow
        });


        await _leaves.SaveChangesAsync();

        var employee = await _leaves.Employees.FindAsync(leave.EmployeeId);
        if (employee != null && !string.IsNullOrWhiteSpace(employee.Email))
        {
            string subject = "Your Leave Application has been Approved";
            string body = $@"
                <p>Hi {employee.Name},</p>
                <p>Your leave from <strong>{leave.StartDate:yyyy-MM-dd}</strong> to <strong>{leave.EndDate:yyyy-MM-dd}</strong> has been <strong>Approved</strong>.</p>
                <p>Approved By: {approver.Name}</p>
                <br/>
                <p>Regards,<br/>WorkKeeper Admin Team</p>
            ";
            await _mailService.SendEmailAsync(employee.Email, subject, body);
        }

        return Ok(new { message = "Leave approved." });
    }

    // 3. Withdraw Leave
    [HttpPut("withdraw/{leaveId}")]
    public async Task<IActionResult> WithdrawLeave(int leaveId, [FromBody] Dictionary<string, string?> data)
    {
        var leave = await _leaves.LeaveApplication.FindAsync(leaveId);
        if (leave == null) return NotFound("Leave application not found.");
        if (leave.Status == "Withdrawn") return BadRequest("Already withdrawn.");

        bool force = data.ContainsKey("force") && bool.TryParse(data["force"], out var parsedForce) && parsedForce;
        if (!force && leave.EndDate < DateTime.UtcNow.Date)
            return BadRequest("Cannot withdraw a leave that has already ended.");

        string? note = data.ContainsKey("note") ? data["note"] : null;
        int? withdrawnBy = data.ContainsKey("withdrawnBy") && int.TryParse(data["withdrawnBy"], out var parsedBy)
            ? parsedBy
            : null;

        leave.Status = "Withdrawn";
        leave.Note = note ?? leave.Note;
        leave.ApprovedBy = withdrawnBy;
        leave.ApprovedOn = DateTime.UtcNow;

        _leaves.LeaveApplication.Update(leave);

        _leaves.Alerts.Add(new Alert
        {
            EmployeeId = leave.EmployeeId,
            Message = $"You withdrew your leave from {leave.StartDate:yyyy-MM-dd} to {leave.EndDate:yyyy-MM-dd}.",
            Type = "Leave",
            CreatedAt = DateTime.UtcNow
        });



        await _leaves.SaveChangesAsync();

        // 📨 Notify Admin
        string adminEmail = "workkeeper71@gmail.com";
        string subject = "Leave Application Withdrawn";
        string body = $@"
            <p>Employee <strong>{leave.EmployeeId}</strong> has withdrawn their leave.</p>
            <p><strong>Leave Duration:</strong> {leave.StartDate:yyyy-MM-dd} to {leave.EndDate:yyyy-MM-dd}</p>
            <p>Note: {note}</p>
        ";
        await _mailService.SendEmailAsync(adminEmail, subject, body);

        return Ok("Leave withdrawn successfully.");
    }

    // 4. Reject Leave
 [HttpPut("reject/{leaveId}")]
public async Task<IActionResult> RejectLeave(int leaveId, [FromBody] Dictionary<string, string?> data)
{
    var leave = await _leaves.LeaveApplication.FindAsync(leaveId);
    if (leave == null)
        return NotFound("Leave application not found.");

    if (leave.Status == "Rejected")
        return BadRequest("Leave is already rejected.");

    if (leave.Status == "Approved")
        return BadRequest("Cannot reject an already approved leave.");

    // Extract values
    string? note = data.ContainsKey("note") ? data["note"] : null;
    int? rejectedBy = data.ContainsKey("rejectedBy") && int.TryParse(data["rejectedBy"], out var parsed)
        ? parsed
        : null;

    leave.Status = "Rejected";
    leave.Note = note ?? leave.Note;
    leave.ApprovedBy = rejectedBy;
    leave.ApprovedOn = DateTime.UtcNow;

    _leaves.Alerts.Add(new Alert
    {
        EmployeeId = leave.EmployeeId,
        Message = $"Your leave request from {leave.StartDate:yyyy-MM-dd} to {leave.EndDate:yyyy-MM-dd} was rejected.",
        Type = "Leave",
        CreatedAt = DateTime.UtcNow
    });

    await _leaves.SaveChangesAsync();

    // Get employee email
    var employee = await _leaves.Employees.FindAsync(leave.EmployeeId);
    if (employee != null && !string.IsNullOrEmpty(employee.Email))
    {
        string subject = $"❌ Leave Rejected - ID #{leave.Id}";
        string body = $@"
           <p> Dear {employee.Name},</p>

            <p>Your leave application (ID: {leave.Id}) has been rejected. </p>

            <p>✉️ Rejection Note:</p>
            <p>{note ?? "No reason provided."} </p>

            - WorkKeeper System
        ";

        // Send email (using injected _emailService)
        await _mailService.SendEmailAsync(employee.Email, subject, body);
    }

    return Ok("Leave rejected successfully.");
}

    // 5. Carry Forward Logic (end-of-year)
    [HttpPost("carry-forward")]
    public async Task<IActionResult> CarryForward()
    {
        var currentYear = DateTime.Now.Year;
        var nextYear = currentYear + 1;

        var policies = await _leaves.EmployeeLeavePolicy
            .Where(p => p.Year == currentYear)
            .ToListAsync();

        foreach (var policy in policies)
        {
            var balance = policy.OpeningBalance + policy.Accrued - policy.Availed;
            var carryForward = Math.Min(balance, 10); // Carry max 10 days

            var nextYearPolicy = await _leaves.EmployeeLeavePolicy
                .FirstOrDefaultAsync(p => p.EmployeeId == policy.EmployeeId &&
                                          p.LeaveTypeId == policy.LeaveTypeId &&
                                          p.Year == nextYear);

            if (nextYearPolicy == null)
            {
                nextYearPolicy = new EmployeeLeavePolicy
                {
                    EmployeeId = policy.EmployeeId,
                    LeaveTypeId = policy.LeaveTypeId,
                    Year = nextYear,
                    OpeningBalance = carryForward,
                    Accrued = 0,
                    Availed = 0,
                    CarryForward = carryForward
                };
                _leaves.EmployeeLeavePolicy.Add(nextYearPolicy);
            }
            else
            {
                nextYearPolicy.OpeningBalance += carryForward;
                nextYearPolicy.CarryForward += carryForward;
                _leaves.EmployeeLeavePolicy.Update(nextYearPolicy);
            }
        }

        await _leaves.SaveChangesAsync();
        return Ok(new { message = "Carry forward processed." });
    }

    // 6. Monthly Privilege Leave (PL) Accrual
    [HttpPost("accrue-pl")]
    public async Task<IActionResult> AccruePrivilegeLeave()
    {
        var currentYear = DateTime.Now.Year;
        var plType = await _leaves.LeaveType.FirstOrDefaultAsync(t => t.Name == "Privilege Leave");
        if (plType == null) return BadRequest("Privilege Leave type not found.");

        var policies = await _leaves.EmployeeLeavePolicy
            .Where(p => p.LeaveTypeId == plType.Id && p.Year == currentYear)
            .ToListAsync();

        foreach (var policy in policies)
        {
            policy.Accrued += 1; // Accrue 1 PL per month
            _leaves.EmployeeLeavePolicy.Update(policy);
        }

        await _leaves.SaveChangesAsync();
        return Ok(new { message = "PL accrued for the month." });
    }

    // 7. Get Leaves By Employee
    [HttpGet("employee/{employeeId}")]
    public async Task<IActionResult> GetLeavesByEmployee(int employeeId)
    {
        var leaves = await _leaves.LeaveApplication
            .Include(x => x.LeaveType)
            .Where(x => x.EmployeeId == employeeId)
            .ToListAsync();

        return Ok(leaves);
    }

    // 8. Get Leave Balance
    [Authorize]
    [HttpGet("balance")]
    public async Task<IActionResult> GetLeaveBalance()
    {
        var currentYear = DateTime.Now.Year;

        // Step 1: Get the currently logged-in User's ID (from the cookie)
        var aspNetUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (aspNetUserId == null)
        {
            return Unauthorized("User not logged in");
        }

        // Step 2: Get EmployeeId from the database using AspNetUserId
        var employee = await _leaves.Employees.FirstOrDefaultAsync(e => e.AspNetUsersId == aspNetUserId);
        if (employee == null)
        {
            return NotFound("Employee not found for this user");
        }

        var employeeId = employee.Id;

        // Step 3: Fetch leave policies and approved leaves
        var policies = await _leaves.EmployeeLeavePolicy
            .Include(p => p.LeaveType)
            .Where(p => p.EmployeeId == employeeId && p.Year == currentYear)
            .ToListAsync();

        var approvedLeaves = await _leaves.LeaveApplication
            .Where(l => l.EmployeeId == employeeId &&
                        l.Status == "Approved" &&
                        l.StartDate.Year == currentYear)
            .ToListAsync();

        var leaveBalances = policies.Select(policy =>
        {
            int taken = approvedLeaves
                .Where(l => l.LeaveTypeId == policy.LeaveTypeId)
                .Sum(l => l.TotalDays);

            int remaining = policy.OpeningBalance + policy.Accrued - taken;

            return new
            {
                leaveType = policy.LeaveType?.Name ?? "Unknown",
                taken = taken,
                remaining = remaining < 0 ? 0 : remaining,
                isOverused = remaining < 0
            };
        }).ToList();

        return Ok(leaveBalances);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetLeaveSummary(int employeeId, int year)
    {
        // 1. Fetch employee leave policies for the year
        var policies = await _leaves.EmployeeLeavePolicy
            .Include(p => p.LeaveType)
            .Where(p => p.EmployeeId == employeeId && p.Year == year)
            .ToListAsync();

        // 2. Fetch all leave applications for the employee in the year
        var applications = await _leaves.LeaveApplication
            .Include(a => a.LeaveType)
            .Where(a => a.EmployeeId == employeeId &&
                        a.StartDate.Year == year)
            .ToListAsync();

        // 3. Prepare breakdown
        var leaveBreakdown = applications
            .Where(a => a.Status == "Approved")
            .GroupBy(a => a.LeaveType?.Name)
            .ToDictionary(
                g => g.Key ?? "Unknown",
                g => g.Sum(a => a.TotalDays)
            );

        var pendingCount = applications.Count(a => a.Status == "Pending");
        var rejectedCount = applications.Count(a => a.Status == "Rejected");

        // 4. Remaining Leaves
        var remainingLeaves = policies.ToDictionary(
            p => p.LeaveType?.Name ?? "Unknown",
            p => (p.OpeningBalance + p.Accrued + p.CarryForward) - p.Availed
        );

        // 5. Total Leaves Taken
        var totalLeavesTaken = applications
            .Where(a => a.Status == "Approved")
            .Sum(a => a.TotalDays);

        // 6. Return Summary
        var summary = new
        {
            employeeId,
            year,
            totalLeavesTaken,
            leaveBreakdown,
            pendingRequests = pendingCount,
            rejectedRequests = rejectedCount,
            remainingLeaves
        };

        return Ok(summary);
    }


    [HttpGet("team-availability/{employeeId}")]
    public async Task<IActionResult> GetTeamAvailability(int employeeId, DateTime? date = null)
    {
        date ??= DateTime.UtcNow.Date;

        var employee = await _leaves.Employees.FindAsync(employeeId);
        if (employee == null) return NotFound("Employee not found.");

        if (string.IsNullOrEmpty(employee.Team))
            return BadRequest("Employee is not part of any team.");

        // Get all team members in the same team
        var teamMembers = await _leaves.Employees
            .Where(e => e.Team == employee.Team)
            .ToListAsync();

        var teamMemberIds = teamMembers.Select(e => e.Id).ToList();

        // Get all APPROVED leaves that overlap with the selected date
        var leavesOnDate = await _leaves.LeaveApplication
            .Where(l => teamMemberIds.Contains(l.EmployeeId)
                && l.Status == "Approved"
                && l.StartDate <= date
                && l.EndDate >= date)
            .Select(l => l.EmployeeId)
            .ToListAsync();

        // Compose response
        var result = teamMembers.Select(e => new
        {
            e.Id,
            e.Name,
            Status = leavesOnDate.Contains(e.Id) ? "On Leave" : "Available"
        });

        return Ok(result);
    }


[HttpGet("pending")]
public async Task<IActionResult> GetPendingLeaves()
{
    var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

    var user = await _leaves.Employees.FindAsync(userId);
    if (user == null) return NotFound("User not found");

    IQueryable<LeaveApplication> query = _leaves.LeaveApplication
        .Include(l => l.Employee)
        .Include(l => l.LeaveType)
        .Where(l => l.Status == "Pending");

    if (user.Role == "Supervisor" && !string.IsNullOrEmpty(user.Team))
    {
        query = query.Where(l => l.Employee.Team == user.Team);
    }

    var leaves = await query
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

    return Ok(leaves);
}



    [HttpGet("public-holidays/upcoming")]
    public async Task<IActionResult> GetUpcomingPublicHolidays(DateTime? fromDate = null)
    {
        fromDate ??= DateTime.UtcNow.Date;

        var holidays = await _leaves.Holidays
            .Where(h => h.HolidayDate >= fromDate)
            .OrderBy(h => h.HolidayDate)
            .Select(h => new
            {
                h.Id,
                Date = h.HolidayDate,
                h.Name
            })
            .ToListAsync();

        return Ok(holidays);
    }
    [Authorize]
    [HttpGet("leave-record")]
    public async Task<IActionResult> GetLeaveRecord()
    {
        var currentYear = DateTime.Now.Year;

        // Step 1: Get the currently logged-in User's ID (from the cookie or token)
        var aspNetUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (aspNetUserId == null)
        {
            return Unauthorized("User not logged in");
        }

        // Step 2: Get EmployeeId from the database using AspNetUserId
        var employee = await _leaves.Employees.FirstOrDefaultAsync(e => e.AspNetUsersId == aspNetUserId);
        if (employee == null)
        {
            return NotFound("Employee not found for this user");
        }


        var leaveRecords = await _leaves.LeaveApplication
            .Where(l => l.EmployeeId == employee.Id)
            .Include(l => l.LeaveType)
            .OrderByDescending(l => l.AppliedOn)
            .Select(l => new
            {
                l.Id,
                l.StartDate,
                l.EndDate,
                l.TotalDays,
                LeaveTypeName = l.LeaveType != null ? l.LeaveType.Name : "",
                l.Status,
                l.AppliedOn,
                l.ApprovedBy,
                l.ApprovedOn,
                l.Note
            })
            .ToListAsync();

        return Ok(leaveRecords);
    }

    [HttpGet("leave-types")]
    public async Task<IActionResult> GetLeaveTypes()
    {
        var leaves = await _leaves.LeaveType
        .Select(l => new
        {
            // l.Id,
            l.Name
        })
        .ToListAsync();

        return Ok(leaves);
    }
}

    
