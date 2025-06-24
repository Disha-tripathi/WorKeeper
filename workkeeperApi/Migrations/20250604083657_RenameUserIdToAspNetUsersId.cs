using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace workkeeperApi.Migrations
{
    /// <inheritdoc />
    public partial class RenameUserIdToAspNetUsersId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "Employee",
                type: "text",
                nullable: true);

            // migrationBuilder.CreateTable(
            //     name: "LeaveType",
            //     columns: table => new
            //     {
            //         Id = table.Column<int>(type: "integer", nullable: false)
            //             .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
            //         Name = table.Column<string>(type: "text", nullable: false),
            //         Description = table.Column<string>(type: "text", nullable: true),
            //         AccrualPolicy = table.Column<string>(type: "text", nullable: true),
            //         MaxPerYear = table.Column<int>(type: "integer", nullable: true),
            //         IsPaid = table.Column<bool>(type: "boolean", nullable: false),
            //         IsCarryForward = table.Column<bool>(type: "boolean", nullable: false),
            //         Eligibility = table.Column<string>(type: "text", nullable: true)
            //     },
            //     constraints: table =>
            //     {
            //         table.PrimaryKey("PK_LeaveType", x => x.Id);
            //     });

            // migrationBuilder.CreateTable(
            //     name: "EmployeeLeavePolicy",
            //     columns: table => new
            //     {
            //         Id = table.Column<int>(type: "integer", nullable: false)
            //             .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
            //         EmployeeId = table.Column<int>(type: "integer", nullable: false),
            //         LeaveTypeId = table.Column<int>(type: "integer", nullable: false),
            //         Year = table.Column<int>(type: "integer", nullable: false),
            //         OpeningBalance = table.Column<int>(type: "integer", nullable: false),
            //         Accrued = table.Column<int>(type: "integer", nullable: false),
            //         Availed = table.Column<int>(type: "integer", nullable: false),
            //         CarryForward = table.Column<int>(type: "integer", nullable: false),
            //         CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            //     },
            //     constraints: table =>
            //     {
            //         table.PrimaryKey("PK_EmployeeLeavePolicy", x => x.Id);
            //         table.ForeignKey(
            //             name: "FK_EmployeeLeavePolicy_LeaveType_LeaveTypeId",
            //             column: x => x.LeaveTypeId,
            //             principalTable: "LeaveType",
            //             principalColumn: "Id",
            //             onDelete: ReferentialAction.Cascade);
            //     });

            // migrationBuilder.CreateTable(
            //     name: "LeaveApplication",
            //     columns: table => new
            //     {
            //         Id = table.Column<int>(type: "integer", nullable: false)
            //             .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
            //         EmployeeId = table.Column<int>(type: "integer", nullable: false),
            //         LeaveTypeId = table.Column<int>(type: "integer", nullable: false),
            //         StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
            //         EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
            //         TotalDays = table.Column<int>(type: "integer", nullable: false),
            //         Status = table.Column<string>(type: "text", nullable: false),
            //         AppliedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
            //         ApprovedBy = table.Column<int>(type: "integer", nullable: true),
            //         ApprovedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
            //         Note = table.Column<string>(type: "text", nullable: true),
            //         CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            //     },
            //     constraints: table =>
            //     {
            //         table.PrimaryKey("PK_LeaveApplication", x => x.Id);
            //         table.ForeignKey(
            //             name: "FK_LeaveApplication_Employee_EmployeeId",
            //             column: x => x.EmployeeId,
            //             principalTable: "Employee",
            //             principalColumn: "Id",
            //             onDelete: ReferentialAction.Cascade);
            //         table.ForeignKey(
            //             name: "FK_LeaveApplication_LeaveType_LeaveTypeId",
            //             column: x => x.LeaveTypeId,
            //             principalTable: "LeaveType",
            //             principalColumn: "Id",
            //             onDelete: ReferentialAction.Cascade);
            //     });

            migrationBuilder.CreateIndex(
                name: "IX_Employee_UserId",
                table: "Employee",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_EmployeeLeavePolicy_LeaveTypeId",
                table: "EmployeeLeavePolicy",
                column: "LeaveTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaveApplication_EmployeeId",
                table: "LeaveApplication",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaveApplication_LeaveTypeId",
                table: "LeaveApplication",
                column: "LeaveTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Employee_AspNetUsers_UserId",
                table: "Employee",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Employee_AspNetUsers_UserId",
                table: "Employee");

            migrationBuilder.DropTable(
                name: "EmployeeLeavePolicy");

            migrationBuilder.DropTable(
                name: "LeaveApplication");

            migrationBuilder.DropTable(
                name: "LeaveType");

            migrationBuilder.DropIndex(
                name: "IX_Employee_UserId",
                table: "Employee");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Employee");
        }
    }
}
