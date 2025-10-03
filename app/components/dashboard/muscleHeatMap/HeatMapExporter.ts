/**
 * Handles exporting heat map visualizations to image files
 */
export class HeatMapExporter {
  private static readonly EXPORT_WIDTH = 800;
  private static readonly EXPORT_HEIGHT = 1000;

  /**
   * Export heat map container to PNG file
   */
  static export(container: HTMLElement): void {
    const canvas = container.querySelector("canvas");
    if (!canvas) {
      console.warn("No canvas found in container for export");
      return;
    }

    // Create a higher resolution canvas for export
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = this.EXPORT_WIDTH;
    exportCanvas.height = this.EXPORT_HEIGHT;
    const exportCtx = exportCanvas.getContext("2d");

    if (!exportCtx) {
      console.error("Failed to get canvas context for export");
      return;
    }

    // Scale up the existing canvas
    exportCtx.fillStyle = "#ffffffff";
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);

    // Download the image
    exportCanvas.toBlob((blob) => {
      if (blob) {
        const link = document.createElement("a");
        link.download = `muscle-heatmap-${
          new Date().toISOString().split("T")[0]
        }.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      }
    });
  }
}
