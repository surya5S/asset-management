using System.Net;
using System.Text.Json;

namespace AssetManagement.API.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public ExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (UnauthorizedAccessException ex)
        {
            await WriteError(context, HttpStatusCode.Unauthorized, ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            await WriteError(context, HttpStatusCode.NotFound, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            await WriteError(context, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (Exception ex)
        {
            await WriteError(context, HttpStatusCode.InternalServerError,
                ex.Message + " | " + ex.InnerException?.Message);
        }
    }

    private static async Task WriteError(
        HttpContext context, HttpStatusCode status, string message)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode  = (int)status;

        var body = JsonSerializer.Serialize(new { message });
        await context.Response.WriteAsync(body);
    }
}

/*
  CONCEPTS IN THIS FILE:
  ─────────────────────────────────────────────
  1. Middleware                   - Code that runs in the HTTP pipeline on every request.
                                    This wraps every controller action in a try/catch —
                                    unhandled exceptions return clean JSON errors, not
                                    HTML crash pages.
  2. RequestDelegate              - Represents the next middleware in the pipeline.
                                    `await _next(context)` passes the request forward.
                                    If it throws, the catch blocks here handle it.
  3. Exception Mapping            - Maps C# exception types to HTTP status codes.
                                    UnauthorizedException → 401, KeyNotFoundException → 404,
                                    InvalidOperationException → 400. Clean REST error responses.
  4. Never leak internals         - The generic `Exception` catch returns a vague message —
                                    not the raw exception. Stack traces and internal errors
                                    should never reach the client in production.
  5. ContentType application/json - Sets the response type before writing the body.
                                    Without this, the client might misparse the response.
*/