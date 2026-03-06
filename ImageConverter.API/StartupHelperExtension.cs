using ImageConverter.Service.Services;

namespace ImageConverter.API;

public static class StartupHelperExtension
{
    public static WebApplication ConfigureServices(this WebApplicationBuilder builder)
    {
        // Read allowed origins from environment variable (comma-separated)
        // Falls back to allow-all for local development
        var allowedOrigins = builder.Configuration["ALLOWED_ORIGINS"]
            ?? Environment.GetEnvironmentVariable("ALLOWED_ORIGINS")
            ?? "*";

        builder.Services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                if (allowedOrigins == "*")
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader();
                }
                else
                {
                    policy.WithOrigins(allowedOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries))
                          .AllowAnyMethod()
                          .AllowAnyHeader();
                }
            });
        });

        builder.Services.AddControllers();

        // Services
        builder.Services.AddScoped<ILocalImageConverterService, LocalImageConverterService>();

        return builder.Build();
    }

    public static WebApplication ConfigurePipeline(this WebApplication app)
    {
        app.UseCors();
        app.MapControllers();

        return app;
    }
}
