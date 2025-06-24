namespace workkeeperApi.Mail;

public interface IMailService
{
    Task SendEmailAsync(string to, string subject, string body);
}
