using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;

namespace workkeeperApi.Mail;
public class MailService : IMailService
{
    private readonly MailSettings _mailSettings;

    public MailService(IOptions<MailSettings> mailSettings)
    {
        _mailSettings = mailSettings.Value;
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        using var smtp = new SmtpClient(_mailSettings.SmtpHost, _mailSettings.SmtpPort)
        {
            Credentials = new NetworkCredential(_mailSettings.UserName, _mailSettings.Password),
            EnableSsl = true
        };

        var mail = new MailMessage
        {
            From = new MailAddress(_mailSettings.From, "WorkKeeper System"),
            Subject = subject,
            Body = body,
            IsBodyHtml = true
        };

        mail.To.Add(to);

        await smtp.SendMailAsync(mail);
    }
}
