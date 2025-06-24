using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using workkeeperApi.Data;

[ApiController]
[Route("alerts")]
public class AlertController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public AlertController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET /alerts/my
    [HttpGet("my")]
    public async Task<IActionResult> GetMyAlerts()
    {
        var aspNetUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (aspNetUserId == null) return Unauthorized();

        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.AspNetUsersId == aspNetUserId);
        if (employee == null) return NotFound("Employee not found");

        var alerts = await _context.Alerts
            .Where(a => a.EmployeeId == employee.Id)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return Ok(alerts);
    }

    // POST /alerts
    [HttpPost]
    public async Task<IActionResult> CreateAlert(Alert alert)
    {
        _context.Alerts.Add(alert);
        await _context.SaveChangesAsync();
        return Ok(alert);
    }

    // PUT /alerts/mark-read/{id}
    [HttpPut("mark-read/{id}")]
    public async Task<IActionResult> MarkRead(int id)
    {
        var alert = await _context.Alerts.FindAsync(id);
        if (alert == null) return NotFound();

        alert.IsRead = true;
        await _context.SaveChangesAsync();
        return Ok(alert);
    }
    [HttpGet("unread/count")]
    public async Task<IActionResult> GetUnreadAlertCount()
    {
        var aspNetUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (aspNetUserId == null) return Unauthorized();

        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.AspNetUsersId == aspNetUserId);
        if (employee == null) return NotFound("Employee not found");

        var count = await _context.Alerts.CountAsync(a => a.EmployeeId == employee.Id && !a.IsRead);
        return Ok(new { count });
    }

}
