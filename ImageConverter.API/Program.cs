using ImageConverter.API;

var builder = WebApplication.CreateBuilder(args);

// Railway provides a PORT environment variable — bind to it
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

var app = builder.ConfigureServices().ConfigurePipeline();

app.Run();
