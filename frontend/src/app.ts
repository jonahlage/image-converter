const API_BASE = "http://localhost:5000/image-converter";

interface ConversionState {
  originalFile: File | null;
  originalPreviewUrl: string | null;
  convertedBlobUrl: string | null;
  convertedFileName: string | null;
  isConverting: boolean;
  conversionTimeMs: number | null;
}

const state: ConversionState = {
  originalFile: null,
  originalPreviewUrl: null,
  convertedBlobUrl: null,
  convertedFileName: null,
  isConverting: false,
  conversionTimeMs: null,
};

function $(id: string): HTMLElement {
  return document.getElementById(id)!;
}

function init(): void {
  const dropzone = $("dropzone");
  const fileInput = $("fileInput") as HTMLInputElement;
  const convertBtn = $("convertBtn") as HTMLButtonElement;
  const downloadBtn = $("downloadBtn") as HTMLButtonElement;
  const clearBtn = $("clearBtn") as HTMLButtonElement;

  dropzone.addEventListener("dragover", (e: Event) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (e: Event) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    const dt = (e as DragEvent).dataTransfer;
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

function handleFile(file: File): void {
  if (state.originalPreviewUrl) URL.revokeObjectURL(state.originalPreviewUrl);
  if (state.convertedBlobUrl) URL.revokeObjectURL(state.convertedBlobUrl);

  state.originalFile = file;
  state.originalPreviewUrl = URL.createObjectURL(file);
  state.convertedBlobUrl = null;
  state.convertedFileName = null;
  state.conversionTimeMs = null;

  const origImg = $("originalImage") as HTMLImageElement;
  origImg.src = state.originalPreviewUrl;
  origImg.style.display = "block";
  $("originalPlaceholder").style.display = "none";

  const ext = file.name.split(".").pop()?.toUpperCase() || "?";
  const sizeKb = (file.size / 1024).toFixed(1);
  $("originalInfo").textContent = `${file.name} — ${ext} — ${sizeKb} KB`;

  ($("convertedImage") as HTMLImageElement).style.display = "none";
  $("convertedPlaceholder").style.display = "flex";
  $("convertedInfo").textContent = "Waiting for conversion...";
  ($("downloadBtn") as HTMLButtonElement).disabled = true;

  ($("convertBtn") as HTMLButtonElement).disabled = false;
  $("status").textContent = `Loaded "${file.name}" — choose a format and click Convert`;
  $("status").className = "status info";
}

async function convert(): Promise<void> {
  if (!state.originalFile) return;

  const formatSelect = $("formatSelect") as HTMLSelectElement;
  const qualityInput = $("qualityInput") as HTMLInputElement;
  const widthInput = $("widthInput") as HTMLInputElement;
  const heightInput = $("heightInput") as HTMLInputElement;
  const convertBtn = $("convertBtn") as HTMLButtonElement;

  const outputFormat = formatSelect.value;
  const jpegQuality = qualityInput.value || "90";
  const resizeWidth = widthInput.value;
  const resizeHeight = heightInput.value;

  let url = `${API_BASE}/local/convert?outputFormat=${outputFormat}&jpegQuality=${jpegQuality}`;
  if (resizeWidth) url += `&resizeWidth=${resizeWidth}`;
  if (resizeHeight) url += `&resizeHeight=${resizeHeight}`;

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
      if (match) fileName = match[1].replace(/['"]/g, "");
    }

    if (state.convertedBlobUrl) URL.revokeObjectURL(state.convertedBlobUrl);

    state.convertedBlobUrl = URL.createObjectURL(blob);
    state.convertedFileName = fileName;

    const convImg = $("convertedImage") as HTMLImageElement;

    const nonPreviewFormats = ["3", "4"]; // Bmp=3, Tiff=4
    if (nonPreviewFormats.includes(outputFormat)) {
      convImg.style.display = "none";
      $("convertedPlaceholder").style.display = "flex";
      ($("convertedPlaceholder") as HTMLElement).innerHTML =
        `<span class="placeholder-icon">✅</span><span>Converted to ${fileName}</span><span style="font-size:0.85rem;opacity:0.6;">Browser can't preview this format — use Download</span>`;
    } else {
      convImg.src = state.convertedBlobUrl;
      convImg.style.display = "block";
      $("convertedPlaceholder").style.display = "none";
    }

    const sizeKb = (blob.size / 1024).toFixed(1);
    $("convertedInfo").textContent = `${fileName} — ${sizeKb} KB — ${state.conversionTimeMs}ms`;

    ($("downloadBtn") as HTMLButtonElement).disabled = false;
    $("status").textContent = `Conversion complete in ${state.conversionTimeMs}ms`;
    $("status").className = "status success";
  } catch (err: any) {
    $("status").textContent = `Error: ${err.message}`;
    $("status").className = "status error";
  } finally {
    state.isConverting = false;
    convertBtn.disabled = false;
    convertBtn.textContent = "Convert";
  }
}

function download(): void {
  if (!state.convertedBlobUrl || !state.convertedFileName) return;
  const a = document.createElement("a");
  a.href = state.convertedBlobUrl;
  a.download = state.convertedFileName;
  a.click();
}

function clear(): void {
  if (state.originalPreviewUrl) URL.revokeObjectURL(state.originalPreviewUrl);
  if (state.convertedBlobUrl) URL.revokeObjectURL(state.convertedBlobUrl);

  state.originalFile = null;
  state.originalPreviewUrl = null;
  state.convertedBlobUrl = null;
  state.convertedFileName = null;
  state.conversionTimeMs = null;

  ($("originalImage") as HTMLImageElement).style.display = "none";
  $("originalPlaceholder").style.display = "flex";
  $("originalInfo").textContent = "No file selected";

  ($("convertedImage") as HTMLImageElement).style.display = "none";
  $("convertedPlaceholder").style.display = "flex";
  ($("convertedPlaceholder") as HTMLElement).innerHTML =
    `<span class="placeholder-icon">🖼️</span><span>Converted image will appear here</span>`;
  $("convertedInfo").textContent = "Waiting for conversion...";

  ($("convertBtn") as HTMLButtonElement).disabled = true;
  ($("downloadBtn") as HTMLButtonElement).disabled = true;
  ($("fileInput") as HTMLInputElement).value = "";

  $("status").textContent = "Upload an image to get started";
  $("status").className = "status info";
}

document.addEventListener("DOMContentLoaded", init);
