using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GreenLedger.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DocumentStorageMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContentType",
                table: "certification_documents",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<long>(
                name: "FileSizeInBytes",
                table: "certification_documents",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContentType",
                table: "certification_documents");

            migrationBuilder.DropColumn(
                name: "FileSizeInBytes",
                table: "certification_documents");
        }
    }
}
