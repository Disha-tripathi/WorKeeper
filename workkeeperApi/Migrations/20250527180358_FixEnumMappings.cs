using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace workkeeperApi.Migrations
{
    /// <inheritdoc />
    public partial class FixEnumMappings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
           
            // migrationBuilder.DropForeignKey(
            //     name: "FK_Attendances_Shifts_ShiftId",
            //     table: "Attendances");

            // migrationBuilder.DropPrimaryKey(
            //     name: "PK_Attendances",
            //     table: "Attendances");

            // migrationBuilder.RenameTable(
            //     name: "Attendances",
            //     newName: "Attendance");

            // migrationBuilder.RenameIndex(
            //     name: "IX_Attendances_ShiftId",
            //     table: "Attendance",
            //     newName: "IX_Attendance_ShiftId");

            // migrationBuilder.AlterDatabase()
            //     .Annotation("Npgsql:Enum:punch_status", "success,duplicate,fail");

            // migrationBuilder.AddPrimaryKey(
            //     name: "PK_Attendance",
            //     table: "Attendance",
            //     column: "Id");

            // migrationBuilder.AddForeignKey(
            //     name: "FK_Attendance_Shifts_ShiftId",
            //     table: "Attendance",
            //     column: "ShiftId",
            //     principalTable: "Shifts",
            //     principalColumn: "Id",
            //     onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attendance_Shifts_ShiftId",
                table: "Attendance");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Attendance",
                table: "Attendance");

            migrationBuilder.RenameTable(
                name: "Attendance",
                newName: "Attendances");

            migrationBuilder.RenameIndex(
                name: "IX_Attendance_ShiftId",
                table: "Attendances",
                newName: "IX_Attendances_ShiftId");

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:Enum:punch_status", "success,duplicate,fail");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Attendances",
                table: "Attendances",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Attendances_Shifts_ShiftId",
                table: "Attendances",
                column: "ShiftId",
                principalTable: "Shifts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
