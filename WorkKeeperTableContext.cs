// using System;
// using System.Collections.Generic;
// using Microsoft.EntityFrameworkCore;

// namespace workkeeperApi.Models;

// public partial class WorkKeeperTableContext : DbContext
// {
//     public WorkKeeperTableContext()
//     {
//     }

//     public WorkKeeperTableContext(DbContextOptions<WorkKeeperTableContext> options)
//         : base(options)
//     {
//     }

//     protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
// #warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
//         => optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=WorkKeeperTable;Username=postgres;Password=123456");

//     protected override void OnModelCreating(ModelBuilder modelBuilder)
//     {
//         modelBuilder.HasSequence("employee_seq").StartsAt(7L);
//         OnModelCreatingPartial(modelBuilder);
//     }

//     partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
// }
