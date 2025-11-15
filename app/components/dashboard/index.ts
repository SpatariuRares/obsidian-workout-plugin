// Export widgets
export * from "@app/components/dashboard/widgets";

// Export business logic
export * from "@app/components/dashboard/business";

// Re-export body components with explicit exports to avoid conflicts
export {
  Muscle,
  Shoulders,
  Chest,
  Back,
  Arms,
  Legs,
  Core,
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
} from "@app/components/dashboard/body";
