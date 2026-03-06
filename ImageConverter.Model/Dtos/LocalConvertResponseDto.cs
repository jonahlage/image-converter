namespace ImageConverter.Model.Dtos;

/// <summary>
/// DTO for local image format conversion response.
/// </summary>
public class LocalConvertResponseDto
{
    public byte[] FileBytes { get; set; } = Array.Empty<byte>();
    public string ContentType { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
}
