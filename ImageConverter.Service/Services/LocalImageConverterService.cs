using ImageConverter.Model.Dtos;
using ImageConverter.Model.Enums;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Bmp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Tiff;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace ImageConverter.Service.Services;

public interface ILocalImageConverterService
{
    Task<LocalConvertResponseDto> ConvertAsync(
        IFormFile file,
        ImageOutputFormat outputFormat,
        int jpegQuality = 90,
        int? resizeWidth = null,
        int? resizeHeight = null);
}

public class LocalImageConverterService : ILocalImageConverterService
{
    private readonly ILogger<LocalImageConverterService> _logger;

    public LocalImageConverterService(ILogger<LocalImageConverterService> logger)
    {
        _logger = logger;
    }

    public async Task<LocalConvertResponseDto> ConvertAsync(
        IFormFile file,
        ImageOutputFormat outputFormat,
        int jpegQuality = 90,
        int? resizeWidth = null,
        int? resizeHeight = null)
    {
        try
        {
            using var inputStream = new MemoryStream();
            await file.CopyToAsync(inputStream);
            inputStream.Position = 0;

            using var image = await Image.LoadAsync(inputStream);

            if (resizeWidth.HasValue || resizeHeight.HasValue)
            {
                var w = resizeWidth ?? 0;
                var h = resizeHeight ?? 0;

                image.Mutate(ctx => ctx.Resize(new ResizeOptions
                {
                    Size = new Size(w, h),
                    Mode = ResizeMode.Max
                }));

                _logger.LogInformation("Resized image to {Width}x{Height}", image.Width, image.Height);
            }

            var (encoder, contentType, extension) = GetEncoder(outputFormat, jpegQuality);

            using var outputStream = new MemoryStream();
            await image.SaveAsync(outputStream, encoder);

            var originalName = Path.GetFileNameWithoutExtension(file.FileName);

            _logger.LogInformation(
                "Local conversion complete: {OriginalFile} → {Format} ({Bytes} bytes)",
                file.FileName, outputFormat, outputStream.Length);

            return new LocalConvertResponseDto
            {
                Success = true,
                FileBytes = outputStream.ToArray(),
                ContentType = contentType,
                FileName = $"{originalName}{extension}"
            };
        }
        catch (UnknownImageFormatException)
        {
            return new LocalConvertResponseDto
            {
                Success = false,
                ErrorMessage = "The uploaded file is not a recognized image format."
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Local image conversion failed");
            return new LocalConvertResponseDto
            {
                Success = false,
                ErrorMessage = $"Conversion failed: {ex.Message}"
            };
        }
    }

    private static (IImageEncoder encoder, string contentType, string extension) GetEncoder(
        ImageOutputFormat format, int jpegQuality)
    {
        return format switch
        {
            ImageOutputFormat.Png => (new PngEncoder(), "image/png", ".png"),
            ImageOutputFormat.Jpeg => (new JpegEncoder { Quality = Math.Clamp(jpegQuality, 1, 100) },
                                       "image/jpeg", ".jpg"),
            ImageOutputFormat.Webp => (new WebpEncoder(), "image/webp", ".webp"),
            ImageOutputFormat.Bmp => (new BmpEncoder(), "image/bmp", ".bmp"),
            ImageOutputFormat.Tiff => (new TiffEncoder(), "image/tiff", ".tiff"),
            _ => throw new ArgumentOutOfRangeException(nameof(format), format,
                     "Unsupported output format.")
        };
    }
}
