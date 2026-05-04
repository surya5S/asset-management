using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using AssetManagement.Application.interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AssetManagement.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;
    private readonly HttpClient _http;

    public EmailService(IConfiguration config, ILogger<EmailService> logger, IHttpClientFactory httpFactory)
    {
        _config = config;
        _logger = logger;
        _http   = httpFactory.CreateClient("Resend");
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetLink)
    {
        var apiKey = _config["Resend:ApiKey"];

        if (string.IsNullOrEmpty(apiKey) || apiKey == "SET_VIA_ENVIRONMENT_VARIABLE")
        {
            _logger.LogError("Resend API key is missing. Set the Resend__ApiKey environment variable.");
            throw new InvalidOperationException("Email service is not configured. Contact the administrator.");
        }

        var fromName  = _config["EmailSettings:FromName"] ?? "AssetManager";
        var fromEmail = _config["EmailSettings:FromEmail"] ?? "onboarding@resend.dev";

        var payload = new
        {
            from    = $"{fromName} <{fromEmail}>",
            to      = new[] { toEmail },
            subject = "Reset your AssetManager password",
            html    = $"""
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
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(
            JsonSerializer.Serialize(payload),
            Encoding.UTF8,
            "application/json");

        try
        {
            var response = await _http.SendAsync(request);
            var body     = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Resend API returned {Status}: {Body}", (int)response.StatusCode, body);
                throw new InvalidOperationException("Failed to send password reset email. Please try again later.");
            }

            _logger.LogInformation("Password reset email sent to {Email} via Resend", toEmail);
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error sending password reset email to {Email}", toEmail);
            throw new InvalidOperationException("Failed to send password reset email. Please try again later.", ex);
        }
    }
}
