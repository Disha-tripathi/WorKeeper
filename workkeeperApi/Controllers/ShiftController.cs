using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using workkeeperApi.Data;
using workkeeperApi.Models;

[ApiController]
[Route("shift")]
public class ShiftController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ShiftController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetShifts()
    {
        var shifts = await _context.Shifts.ToListAsync();
        return Ok(shifts);
    }

[HttpGet("GetCurrentShift")]
public async Task<IActionResult> GetCurrentShift()
{
    // Step 1: Get logged-in user's AspNetUserId from claims
    var aspNetUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (aspNetUserId == null)
    {
        return Unauthorized("User not logged in");
    }

    // Step 2: Find Employee record using AspNetUserId
    var employee = await _context.Employees
        .FirstOrDefaultAsync(e => e.AspNetUsersId == aspNetUserId);

    if (employee == null)
    {
        return NotFound("Employee not found for this user");
    }

    // Step 3: Get their Shift
    var shift = await _context.Shifts
        .FirstOrDefaultAsync(s => s.Id == employee.ShiftId);

    if (shift == null)
    {
        return NotFound("Shift not found for this employee");
    }

    // Step 4: Return the shift
    return Ok(new
    {
        shift.Id,
        shift.Name,
        shift.StartTime,
        shift.EndTime,
        shift.BreakDuration,
        shift.ExpectedHours,
        shift.createdat
    });
}

}
