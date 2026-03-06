declare const API_BASE = "http://localhost:5000/image-converter";
interface ConversionState {
    originalFile: File | null;
    originalPreviewUrl: string | null;
    convertedBlobUrl: string | null;
    convertedFileName: string | null;
    isConverting: boolean;
    conversionTimeMs: number | null;
}
declare const state: ConversionState;
declare function $(id: string): HTMLElement;
declare function init(): void;
declare function handleFile(file: File): void;
declare function convert(): Promise<void>;
declare function download(): void;
declare function clear(): void;
