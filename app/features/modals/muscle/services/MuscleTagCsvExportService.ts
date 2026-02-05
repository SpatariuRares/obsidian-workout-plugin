export class MuscleTagCsvExportService {
  static buildCsvContent(tags: Map<string, string>): string {
    const csvLines: string[] = ["tag,muscleGroup"];

    const sortedTags = Array.from(tags.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );

    for (const [tag, muscleGroup] of sortedTags) {
      csvLines.push(
        `${this.escapeCsvValue(tag)},${this.escapeCsvValue(muscleGroup)}`,
      );
    }

    return csvLines.join("\n");
  }

  private static escapeCsvValue(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
