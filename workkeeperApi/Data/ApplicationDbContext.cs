using System.Linq.Expressions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using workkeeperApi.Models;

namespace workkeeperApi.Data;

public class ApplicationDbContext : IdentityDbContext<IdentityUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public new DbSet<User> Users {get; set;}
    public DbSet<Admin> Admins { get; set; }
    public DbSet<Supervisor> Supervisors { get; set; }
    public DbSet<Alert> Alerts { get; set; }
    public DbSet<Employee> Employees { get; set; }
    public DbSet<Shift> Shifts { get; set; }
    public DbSet<DeleteLog> DeleteLogs { get; set; }
    public DbSet<Attendance> Attendances {get; set;}
    public DbSet<AttendanceInLog> AttendanceInLog {get; set;}
    public DbSet<Holiday> Holidays { get; set; }
    public DbSet<LeaveType> LeaveType { get; set; }
    public DbSet<LeaveApplication> LeaveApplication { get; set; }
    public DbSet<EmployeeLeavePolicy> EmployeeLeavePolicy { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var dateTimeConverter = new ValueConverter<DateTime, DateTime>(
        v => v.ToUniversalTime(),
        v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

    var nullableDateTimeConverter = new ValueConverter<DateTime?, DateTime?>(
        v => v.HasValue ? v.Value.ToUniversalTime() : v,
        v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v
    );

    foreach (var entityType in modelBuilder.Model.GetEntityTypes())
    {
        var properties = entityType.ClrType.GetProperties()
            .Where(p => p.PropertyType == typeof(DateTime) || p.PropertyType == typeof(DateTime?));

        foreach (var property in properties)
        {
            var propertyBuilder = modelBuilder.Entity(entityType.ClrType).Property(property.Name);

            if (property.PropertyType == typeof(DateTime))
                propertyBuilder.HasConversion(dateTimeConverter);
            else
                propertyBuilder.HasConversion(nullableDateTimeConverter);
        }
    }



        modelBuilder.Entity<Attendance>()
            .Property(a => a.Status)
            .HasColumnType("attendance_status");

        modelBuilder.Entity<Attendance>()
            .Property(a => a.PunchStatus)
            .HasColumnType("punch_status");

        modelBuilder.Entity<AttendanceInLog>()
            .Property(l => l.Source)
            .HasColumnType("source_enum");

       
    }

}
