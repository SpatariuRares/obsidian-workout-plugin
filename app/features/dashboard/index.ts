// Types
export type {
  EmbeddedDashboardParams,
  ProtocolFilterCallback,
  MuscleHeatMapOptions,
} from "@app/features/dashboard/types";

// Views
export { EmbeddedDashboardView } from "@app/features/dashboard/views/EmbeddedDashboardView";

// Modals
export { InsertDashboardModal } from "@app/features/dashboard/modals/InsertDashboardModal";

// Widgets
export * from "@app/features/dashboard/widgets";

// Business logic
export * from "@app/features/dashboard/business";

// UI components
export * from "@app/features/dashboard/ui";

// Re-export body components with explicit exports to avoid conflicts
export {
  Muscle,
  Shoulders,
  Chest,
  Back,
  Arms,
  Legs,
  Core,
} from "@app/features/dashboard/body";

export type {
  MusclePartData,
  ShoulderData,
  ChestData,
  BackData,
  ArmsData,
  LegsData,
  CoreData,
  BodyData,
} from "@app/features/dashboard/body";
