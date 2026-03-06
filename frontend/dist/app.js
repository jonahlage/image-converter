"use strict";
// API_BASE: reads from a global set by the hosting page, or falls back to localhost for development
const API_BASE = window.__API_BASE__ || "http://localhost:5000/image-converter";
const state = {
    originalFile: null,
    originalPreviewUrl: null,
    convertedBlobUrl: null,
    convertedFileName: null,
    isConverting: false,
    conversionTimeMs: null,
};
function $(id) {
    return document.getElementById(id);
}
function init() {
    const dropzone = $("dropzone");
    const fileInput = $("fileInput");
    const convertBtn = $("convertBtn");
    const downloadBtn = $("downloadBtn");
    const clearBtn = $("clearBtn");
    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
    });
    dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dragover");
    });
    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        const dt = e.dataTransfer;
        if (dt?.files.length) {
            handleFile(dt.files[0]);
        }
    });
    dropzone.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => {
        if (fileInput.files?.length) {
            handleFile(fileInput.files[0]);
        }
    });
    convertBtn.addEventListener("click", convert);
    downloadBtn.addEventListener("click", download);
    clearBtn.addEventListener("click", clear);
}
function handleFile(file) {
    if (state.originalPreviewUrl)
        URL.revokeObjectURL(state.originalPreviewUrl);
    if (state.convertedBlobUrl)
        URL.revokeObjectURL(state.convertedBlobUrl);
    state.originalFile = file;
    state.originalPreviewUrl = URL.createObjectURL(file);
    state.convertedBlobUrl = null;
    state.convertedFileName = null;
    state.conversionTimeMs = null;
    const origImg = $("originalImage");
    origImg.src = state.originalPreviewUrl;
    origImg.style.display = "block";
    $("originalPlaceholder").style.display = "none";
    const ext = file.name.split(".").pop()?.toUpperCase() || "?";
    const sizeKb = (file.size / 1024).toFixed(1);
    $("originalInfo").textContent = `${file.name} — ${ext} — ${sizeKb} KB`;
    $("convertedImage").style.display = "none";
    $("convertedPlaceholder").style.display = "flex";
    $("convertedInfo").textContent = "Waiting for conversion...";
    $("downloadBtn").disabled = true;
    $("convertBtn").disabled = false;
    $("status").textContent = `Loaded "${file.name}" — choose a format and click Convert`;
    $("status").className = "status info";
}
async function convert() {
    if (!state.originalFile)
        return;
    const formatSelect = $("formatSelect");
    const qualityInput = $("qualityInput");
    const widthInput = $("widthInput");
    const heightInput = $("heightInput");
    const convertBtn = $("convertBtn");
    const outputFormat = formatSelect.value;
    const jpegQuality = qualityInput.value || "90";
    const resizeWidth = widthInput.value;
    const resizeHeight = heightInput.value;
    let url = `${API_BASE}/local/convert?outputFormat=${outputFormat}&jpegQuality=${jpegQuality}`;
    if (resizeWidth)
        url += `&resizeWidth=${resizeWidth}`;
    if (resizeHeight)
        url += `&resizeHeight=${resizeHeight}`;
    const formData = new FormData();
    formData.append("file", state.originalFile);
    state.isConverting = true;
    convertBtn.disabled = true;
    convertBtn.textContent = "Converting...";
    $("status").textContent = "Converting...";
    $("status").className = "status info";
    const startTime = performance.now();
    try {
        const response = await fetch(url, {
            method: "POST",
            body: formData,
        });
        const elapsed = performance.now() - startTime;
        state.conversionTimeMs = Math.round(elapsed);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || `HTTP ${response.status}`);
        }
        const blob = await response.blob();
        const contentDisposition = response.headers.get("content-disposition");
        let fileName = "converted";
        if (contentDisposition) {
            const match = contentDisposition.match(/filename=([^;]+)/);
            if (match)
                fileName = match[1].replace(/['"]/g, "");
        }
        if (state.convertedBlobUrl)
            URL.revokeObjectURL(state.convertedBlobUrl);
        state.convertedBlobUrl = URL.createObjectURL(blob);
        state.convertedFileName = fileName;
        const convImg = $("convertedImage");
        const nonPreviewFormats = ["3", "4"]; // Bmp=3, Tiff=4
        if (nonPreviewFormats.includes(outputFormat)) {
            convImg.style.display = "none";
            $("convertedPlaceholder").style.display = "flex";
            $("convertedPlaceholder").innerHTML =
                `<span class="placeholder-icon">✅</span><span>Converted to ${fileName}</span><span style="font-size:0.85rem;opacity:0.6;">Browser can't preview this format — use Download</span>`;
        }
        else {
            convImg.src = state.convertedBlobUrl;
            convImg.style.display = "block";
            $("convertedPlaceholder").style.display = "none";
        }
        const sizeKb = (blob.size / 1024).toFixed(1);
        $("convertedInfo").textContent = `${fileName} — ${sizeKb} KB — ${state.conversionTimeMs}ms`;
        $("downloadBtn").disabled = false;
        $("status").textContent = `Conversion complete in ${state.conversionTimeMs}ms`;
        $("status").className = "status success";
    }
    catch (err) {
        $("status").textContent = `Error: ${err.message}`;
        $("status").className = "status error";
    }
    finally {
        state.isConverting = false;
        convertBtn.disabled = false;
        convertBtn.textContent = "Convert";
    }
}
function download() {
    if (!state.convertedBlobUrl || !state.convertedFileName)
        return;
    const a = document.createElement("a");
    a.href = state.convertedBlobUrl;
    a.download = state.convertedFileName;
    a.click();
}
function clear() {
    if (state.originalPreviewUrl)
        URL.revokeObjectURL(state.originalPreviewUrl);
    if (state.convertedBlobUrl)
        URL.revokeObjectURL(state.convertedBlobUrl);
    state.originalFile = null;
    state.originalPreviewUrl = null;
    state.convertedBlobUrl = null;
    state.convertedFileName = null;
    state.conversionTimeMs = null;
    $("originalImage").style.display = "none";
    $("originalPlaceholder").style.display = "flex";
    $("originalInfo").textContent = "No file selected";
    $("convertedImage").style.display = "none";
    $("convertedPlaceholder").style.display = "flex";
    $("convertedPlaceholder").innerHTML =
        `<span class="placeholder-icon">🖼️</span><span>Converted image will appear here</span>`;
    $("convertedInfo").textContent = "Waiting for conversion...";
    $("convertBtn").disabled = true;
    $("downloadBtn").disabled = true;
    $("fileInput").value = "";
    $("status").textContent = "Upload an image to get started";
    $("status").className = "status info";
}
document.addEventListener("DOMContentLoaded", init);
//# sourceMappingURL=app.js.map