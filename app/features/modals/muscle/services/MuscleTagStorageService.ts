import type WorkoutChartsPlugin from "main";

export class MuscleTagStorageService {
  constructor(private readonly plugin: WorkoutChartsPlugin) {}

  async loadTags(): Promise<Map<string, string>> {
    return this.plugin.getMuscleTagService().loadTags();
  }

  async saveTags(tags: Map<string, string>): Promise<void> {
    await this.plugin.getMuscleTagService().saveTags(tags);
  }
}
