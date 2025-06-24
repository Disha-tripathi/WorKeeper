using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace workkeeperApi.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminAndSupervisorTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Admin",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AspNetUsersId = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    MobileNumber = table.Column<string>(type: "text", nullable: true),
                    AdminUniqueId = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Admin", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Admin_AspNetUsers_AspNetUsersId",
                        column: x => x.AspNetUsersId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Supervisor",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AspNetUsersId = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    MobileNumber = table.Column<string>(type: "text", nullable: true),
                    SupervisorUniqueId = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Supervisor", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Supervisor_AspNetUsers_AspNetUsersId",
                        column: x => x.AspNetUsersId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceInLog_EmployeeId",
                table: "AttendanceInLog",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceInLog_ShiftId",
                table: "AttendanceInLog",
                column: "ShiftId");

            migrationBuilder.CreateIndex(
                name: "IX_Admin_AspNetUsersId",
                table: "Admin",
                column: "AspNetUsersId");

            migrationBuilder.CreateIndex(
                name: "IX_Supervisor_AspNetUsersId",
                table: "Supervisor",
                column: "AspNetUsersId");

            migrationBuilder.AddForeignKey(
                name: "FK_AttendanceInLog_Employee_EmployeeId",
                table: "AttendanceInLog",
                column: "EmployeeId",
                principalTable: "Employee",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AttendanceInLog_Shifts_ShiftId",
                table: "AttendanceInLog",
                column: "ShiftId",
                principalTable: "Shifts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AttendanceInLog_Employee_EmployeeId",
                table: "AttendanceInLog");

            migrationBuilder.DropForeignKey(
                name: "FK_AttendanceInLog_Shifts_ShiftId",
                table: "AttendanceInLog");

            migrationBuilder.DropTable(
                name: "Admin");

            migrationBuilder.DropTable(
                name: "Supervisor");

            migrationBuilder.DropIndex(
                name: "IX_AttendanceInLog_EmployeeId",
                table: "AttendanceInLog");

            migrationBuilder.DropIndex(
                name: "IX_AttendanceInLog_ShiftId",
                table: "AttendanceInLog");
        }
    }
}
