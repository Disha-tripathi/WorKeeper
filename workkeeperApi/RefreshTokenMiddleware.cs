public class RefreshTokenMiddleware
{
    private readonly RequestDelegate _next;

    public RefreshTokenMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Your token refresh logic here

        // Call the next middleware in the pipeline
        await _next(context);
    }
}
