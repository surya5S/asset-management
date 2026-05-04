using AssetManagement.Application.interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace AssetManagement.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config) => _config = config;

    public async Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetLink)
    {
        var s = _config.GetSection("EmailSettings");

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(s["FromName"], s["FromEmail"]!));
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

        using var client = new SmtpClient();
        await client.ConnectAsync(
            s["SmtpHost"]!,
            int.Parse(s["SmtpPort"] ?? "587"),
            SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(s["Username"]!, s["Password"]!);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}
