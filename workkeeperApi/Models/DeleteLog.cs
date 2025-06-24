public class DeleteLog
{
    public int Id { get; set; }

    public string TableName { get; set; } = string.Empty;

    public int RecordId { get; set; }

    public string? DeletedBy { get; set; }

    public DateTime DeletedAt { get; set; }

    public string? Notes { get; set; }  // optional: reason, source, etc.
}
