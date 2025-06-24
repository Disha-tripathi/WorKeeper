using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace workkeeperApi.Migrations
{
    /// <inheritdoc />
    public partial class AddDeleteLogTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // migrationBuilder.AlterDatabase()
            //     .OldAnnotation("Npgsql:Enum:punch_status", "success,duplicate,fail");

            // migrationBuilder.AlterColumn<string>(
            //     name: "Status",
            //     table: "Attendance",
            //     type: "attendance_status",
            //     nullable: true,
            //     oldClrType: typeof(int),
            //     oldType: "attendance_status");

            // migrationBuilder.AlterColumn<string>(
            //     name: "PunchStatus",
            //     table: "Attendance",
            //     type: "punch_status",
            //     nullable: true,
            //     oldClrType: typeof(int),
            //     oldType: "punch_status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:Enum:punch_status", "success,duplicate,fail");

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "Attendance",
                type: "attendance_status",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(string),
                oldType: "attendance_status",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "PunchStatus",
                table: "Attendance",
                type: "punch_status",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(string),
                oldType: "punch_status",
                oldNullable: true);
        }
    }
}
