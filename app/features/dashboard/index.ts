// Export widgets
export * from "@app/features/dashboard/widgets";

// Export business logic
export * from "@app/features/dashboard/business";

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

