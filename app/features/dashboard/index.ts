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

export type {
  ShoulderData,
  ChestData,
  BackData,
  ArmsData,
  LegsData,
  CoreData,
  BodyData,
} from "@app/features/dashboard/widgets/muscle-heat-map/body";
