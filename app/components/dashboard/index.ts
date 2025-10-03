export * from "./SummaryWidget";
export * from "./QuickStatsCards";
export * from "./VolumeAnalytics";
export * from "./RecentWorkouts";
export * from "./QuickActions";
export * from "./DashboardCalculations";

// Export muscle heat map components
export * from "./muscleHeatMap";

// Re-export body components with explicit exports to avoid conflicts
export {
  Muscle,
  Shoulders,
  Chest,
  Back,
  Arms,
  Legs,
  Core,
  BodyHeatMap
} from "./body";

export type {
  MusclePartData,
  ShoulderData,
  ChestData,
  BackData,
  ArmsData,
  LegsData,
  CoreData,
  BodyData,
  BodyHeatMapOptions
} from "./body";