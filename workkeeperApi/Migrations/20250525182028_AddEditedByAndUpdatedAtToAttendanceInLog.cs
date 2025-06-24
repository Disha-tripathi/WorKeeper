using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace workkeeperApi.Migrations
{
    /// <inheritdoc />
    public partial class AddEditedByAndUpdatedAtToAttendanceInLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EditedBy",
                table: "AttendanceInLog",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "AttendanceInLog",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EditedBy",
                table: "AttendanceInLog");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "AttendanceInLog");
        }
    }
}
