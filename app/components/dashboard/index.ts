export * from "@app/components/dashboard/SummaryWidget";
export * from "@app/components/dashboard/QuickStatsCards";
export * from "@app/components/dashboard/VolumeAnalytics";
export * from "@app/components/dashboard/RecentWorkouts";
export * from "@app/components/dashboard/WidgetsFileError";
export * from "@app/components/dashboard/QuickActions";
export * from "@app/components/dashboard/DashboardCalculations";
export * from "@app/components/dashboard/MuscleTagsWidget";

// Export muscle heat map components
export * from "@app/components/dashboard/muscleHeatMap";

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
} from "@app/components/dashboard/body";

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
} from "@app/components/dashboard/body";