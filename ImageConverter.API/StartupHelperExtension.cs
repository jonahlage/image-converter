using ImageConverter.Service.Services;

namespace ImageConverter.API;

public static class StartupHelperExtension
{
    public static WebApplication ConfigureServices(this WebApplicationBuilder builder)
    {
        builder.Services.AddCors(options =>
        {
            options.AddDefaultPolicy(policy =>
            {
                policy.AllowAnyOrigin()
                      .AllowAnyMethod()
                      .AllowAnyHeader();
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
