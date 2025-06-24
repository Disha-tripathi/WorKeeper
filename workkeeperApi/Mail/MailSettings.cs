namespace workkeeperApi.Mail;

public class MailSettings
{
    public required string From { get; set; }
    public required string SmtpHost { get; set; }
    public required int SmtpPort { get; set; }
    public required string UserName { get; set; }
    public required string Password { get; set; }
}
