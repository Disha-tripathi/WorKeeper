using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace workkeeperApi.Models;

public partial class ApplicationDbContext : DbContext
{
    public ApplicationDbContext()
    {
    }

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Attendance> Attendances { get; set; }

    public virtual DbSet<AttendanceInLog> AttendanceInLogs { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=WorkKeeperTable;Username=postgres;Password=123456");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .HasPostgresEnum("attendance_status", new[] { "valid", "invalid", "duplicate", "hr_override", "valid_short_break" })
            .HasPostgresEnum("punch_status", new[] { "success", "duplicate", "fail" })
            .HasPostgresEnum("source_enum", new[] { "punch_machine", "thumb_scanner", "web_portal", "mobile_app", "hr_manual", "api_import" })
            .HasPostgresEnum("status_enum", new[] { "success", "fail", "duplicate" });

        modelBuilder.Entity<Attendance>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Attendance_pkey1");

            entity.ToTable("Attendance");

            entity.Property(e => e.Id).HasDefaultValueSql("nextval('\"Attendance_Id_seq1\"'::regclass)");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()");
            entity.Property(e => e.IsManual).HasDefaultValue(false);
            entity.Property(e => e.PunchStatus).HasMaxLength(30);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .HasDefaultValueSql("'Present'::character varying");
            entity.Property(e => e.TotalHours).HasPrecision(5, 2);
        });

        modelBuilder.Entity<AttendanceInLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Attendance_pkey");

            entity.ToTable("AttendanceInLog");

            entity.Property(e => e.Id).HasDefaultValueSql("nextval('\"Attendance_Id_seq\"'::regclass)");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.PunchDateTime).HasColumnType("timestamp without time zone");
            entity.Property(e => e.PunchType).HasMaxLength(10);
            entity.Property(e => e.Status).HasMaxLength(20);
        });
        modelBuilder.HasSequence("employee_seq").StartsAt(7L);

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
