# Image Converter

A .NET 8 backend + TypeScript frontend for converting images between formats (PNG, JPEG, WebP, BMP, TIFF) with optional resizing.

## Live Demo

[https://jonahlage.github.io/image-converter/frontend/](https://jonahlage.github.io/image-converter/frontend/)

> Note: The live demo is a frontend-only preview. For full conversion functionality, run the backend locally.

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) (v18+)

## How to Run

### 1. Start the backend

```bash
cd ImageConverter.API
dotnet run
```

API starts on **http://localhost:5000**.

### 2. Build and serve the frontend

In a second terminal:

```bash
cd frontend
npm install
npx tsc
npx serve -l 3000
```

Open **http://localhost:3000** in your browser.

## Project Structure

```
ImageConverter.Model/     — DTOs and Enums
ImageConverter.Service/   — LocalImageConverterService (ImageSharp)
ImageConverter.API/       — ASP.NET Core API + StartupHelperExtension
frontend/                 — TypeScript + HTML UI
```
