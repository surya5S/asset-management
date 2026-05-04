using AssetManagement.Application.interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace AssetManagement.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetLink)
    {
        var s = _config.GetSection("EmailSettings");

        var smtpHost = s["SmtpHost"];
        var username = s["Username"];
        var fromEmail = s["FromEmail"];

        if (string.IsNullOrEmpty(smtpHost) || smtpHost == "SET_VIA_ENVIRONMENT_VARIABLE" ||
            string.IsNullOrEmpty(username) || username == "SET_VIA_ENVIRONMENT_VARIABLE" ||
            string.IsNullOrEmpty(fromEmail) || fromEmail == "SET_VIA_ENVIRONMENT_VARIABLE")
        {
            _logger.LogError("Email configuration is missing or not set. Check EmailSettings environment variables (EmailSettings__SmtpHost, EmailSettings__Username, EmailSettings__Password, EmailSettings__FromEmail).");
            throw new InvalidOperationException("Email service is not configured. Contact the administrator.");
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(s["FromName"], fromEmail));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = "Reset your AssetManager password";

        message.Body = new BodyBuilder
        {
            HtmlBody = $"""
                <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0f172a;border-radius:12px;">
                  <h2 style="color:#e2e8f0;margin-bottom:8px;">Reset your password</h2>
                  <p style="color:#94a3b8;margin-bottom:28px;line-height:1.6;">
                    Click the button below to reset your AssetManager password.
                    This link expires in <strong style="color:#e2e8f0;">15 minutes</strong>.
                  </p>
                  <a href="{resetLink}"
                     style="display:inline-block;background:#6366f1;color:#fff;
                            text-decoration:none;padding:12px 28px;border-radius:8px;
                            font-weight:600;font-size:15px;">
                    Reset Password
                  </a>
                  <p style="color:#64748b;font-size:13px;margin-top:28px;">
                    If you didn't request a password reset, you can safely ignore this email.
                    Your password will not be changed.
                  </p>
                </div>
                """
        }.ToMessageBody();

        try
        {
            using var client = new SmtpClient();
            await client.ConnectAsync(
                smtpHost,
                int.Parse(s["SmtpPort"] ?? "587"),
                SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(username, s["Password"]!);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Password reset email sent to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email to {Email} via {SmtpHost}", toEmail, smtpHost);
            throw new InvalidOperationException("Failed to send password reset email. Please try again later.", ex);
        }
    }
}
