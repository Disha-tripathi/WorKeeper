using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace workkeeperApi.Models;

public partial class WorkKeeperTableContext : DbContext
{
    public WorkKeeperTableContext()
    {
    }

    public WorkKeeperTableContext(DbContextOptions<WorkKeeperTableContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Employee> Employees { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
// #warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=WorkKeeperTable;Username=postgres;Password=123456");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Employees1_pkey");

            entity.ToTable("Employee");

            entity.HasIndex(e => e.EmployeeUniqueId, "Employees1_EmployeeUniqueId_key").IsUnique();

            entity.Property(e => e.Id).HasDefaultValueSql("nextval('\"Employees1_Id_seq\"'::regclass)");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp without time zone");
            entity.Property(e => e.Department).HasMaxLength(100);
            entity.Property(e => e.Role).HasMaxLength(100);
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.EmployeeGroup).HasMaxLength(50);
            entity.Property(e => e.EmployeeUniqueId).HasMaxLength(50);
            entity.Property(e => e.EmploymentStatus).HasMaxLength(50);
            entity.Property(e => e.MobileNumber).HasMaxLength(15);
            entity.Property(e => e.Name).HasMaxLength(255);
            entity.Property(e => e.Office).HasMaxLength(100);
            entity.Property(e => e.Team).HasMaxLength(100);
        });
        modelBuilder.HasSequence("employee_seq").StartsAt(7L);

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
