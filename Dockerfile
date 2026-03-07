# ──────────────────────────────────────────────────────────────
# Image Converter API — Multi-stage Docker build
# ──────────────────────────────────────────────────────────────
# Stage 1: Build the .NET app
# Stage 2: Run it in a tiny runtime-only image
#
# WHY DOCKER?
# Docker packages your app + its exact .NET runtime + all
# dependencies into a single portable "container image."
# Railway (or any host) pulls that image and runs it — no need
# to install .NET on the server, no "works on my machine" issues.
# ──────────────────────────────────────────────────────────────

# ── Stage 1: Build ──────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files first (cache NuGet restore)
COPY ImageConverter.sln ./
COPY ImageConverter.API/ImageConverter.API.csproj ImageConverter.API/
COPY ImageConverter.Service/ImageConverter.Service.csproj ImageConverter.Service/
COPY ImageConverter.Model/ImageConverter.Model.csproj ImageConverter.Model/

# Restore NuGet packages (cached unless .csproj files change)
RUN dotnet restore

# Copy everything else and build
COPY . .
RUN dotnet publish ImageConverter.API/ImageConverter.API.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# ── Stage 2: Runtime ────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Copy published output from build stage
COPY --from=build /app/publish .

# Expose default port (Railway overrides via PORT env var at runtime)
EXPOSE 8080

# Start the API — Program.cs reads PORT env var and binds accordingly
ENTRYPOINT ["dotnet", "ImageConverter.API.dll"]
