using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace workkeeperApi.Migrations
{
    /// <inheritdoc />
    public partial class AddJobAndReportsToUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // migrationBuilder.RenameColumn(
            //     name: "Designation",
            //     table: "Employee",
            //     newName: "Role");

            migrationBuilder.AddColumn<string>(
                name: "JobTitle",
                table: "Employee",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReportsToUserId",
                table: "Employee",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "JobTitle",
                table: "Employee");

            migrationBuilder.DropColumn(
                name: "ReportsToUserId",
                table: "Employee");

            migrationBuilder.RenameColumn(
                name: "Role",
                table: "Employee",
                newName: "Designation");
        }
    }
}
