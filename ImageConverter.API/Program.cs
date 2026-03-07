using ImageConverter.API;

var builder = WebApplication.CreateBuilder(args);

// Get the port Railway provides — throw if missing in prod (helps debug)
var portString = Environment.GetEnvironmentVariable("PORT");
if (string.IsNullOrEmpty(portString))
{
    // For local dev only — Railway will always set this
    portString = "8080";
    Console.WriteLine("Warning: PORT env var not set — using fallback 8080 (local dev?)");
}
else
{
    Console.WriteLine($"Using Railway PORT: {portString}");
}

var port = int.Parse(portString);

builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
// Or more robust:
builder.WebHost.UseKestrel(options =>
{
    options.ListenAnyIP(port);  // Binds IPv4 + IPv6 on the exact port
});

// Optional: Log the actual bound port for confirmation
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Information);

var app = builder.Build();

// Your ConfigurePipeline (CORS, /health GET, MapControllers)

app.Run();