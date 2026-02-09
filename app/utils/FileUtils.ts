import { DomUtils } from "@app/utils/DomUtils";

/**
 * Reads a text file using FileReader API.
 * @param file - File object to read
 * @returns Promise resolving to file contents as string
 */
export function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      resolve((event.target?.result as string) || "");
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}

/**
 * Downloads content as a CSV file.
 * Creates a temporary download link and triggers browser download.
 * @param csvContent - CSV content string to download
 * @param filename - Desired filename for the download
 */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  DomUtils.setCssProps(link, { display: "none" });
  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
