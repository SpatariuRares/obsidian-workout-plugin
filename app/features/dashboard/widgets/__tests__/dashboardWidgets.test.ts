import { resolveWidgets } from "@app/features/dashboard/widgets/dashboardWidgets";

const ALL = [
  "summary",
  "quickStats",
  "heatMap",
  "volume",
  "recentWorkouts",
  "protocolDistribution",
  "protocolEffectiveness",
  "duration",
  "quickActions",
  "fileErrors",
  "muscleTags",
  "trainingCalendar",
];

describe("resolveWidgets", () => {
  it("shows every widget in the default order when the block names none", () => {
    expect(resolveWidgets({})).toEqual(ALL);
  });

  it("shows only the listed widgets, in the listed order, each once", () => {
    expect(
      resolveWidgets({ widgets: ["volume", "summary", "volume"] }),
    ).toEqual(["volume", "summary"]);
  });
});
