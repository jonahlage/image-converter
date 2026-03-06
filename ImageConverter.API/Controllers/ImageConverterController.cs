using ImageConverter.Model.Enums;
using ImageConverter.Service.Services;
using Microsoft.AspNetCore.Mvc;

namespace ImageConverter.API.Controllers;

[Route("image-converter")]
[ApiController]
public class ImageConverterController : ControllerBase
{
    private readonly ILocalImageConverterService _localService;

    public ImageConverterController(ILocalImageConverterService localService)
    {
        _localService = localService;
    }

    /// <summary>
    /// Converts an image to a different format locally using ImageSharp.
    /// Returns the converted file as a download.
    /// </summary>
    [HttpPost("local/convert")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> LocalConvert(
        IFormFile file,
        [FromQuery] ImageOutputFormat outputFormat = ImageOutputFormat.Png,
        [FromQuery] int jpegQuality = 90,
        [FromQuery] int? resizeWidth = null,
        [FromQuery] int? resizeHeight = null)
    {
        if (file is null || file.Length == 0)
            return BadRequest("No file uploaded.");

        var result = await _localService.ConvertAsync(
            file, outputFormat, jpegQuality, resizeWidth, resizeHeight);

        if (!result.Success)
            return BadRequest(new { error = result.ErrorMessage });

        return File(result.FileBytes, result.ContentType, result.FileName);
    }
}
