// Types
export type {
  EmbeddedTableParams,
  TableRow,
  TableData,
  TableCodeOptions,
  TableState,
  TableCallbacks,
} from "@app/features/tables/types";
export { TABLE_TYPE } from "@app/features/tables/types";

// Views
export { EmbeddedTableView } from "@app/features/tables/views/EmbeddedTableView";

// Components
export { TableRenderer } from "@app/features/tables/components/TableRenderer";
export { TableActions } from "@app/features/tables/components/TableActions";

// Business logic
export {
  TableDataLoader,
  TableDataProcessor,
  TableRefresh,
  TableConfig,
  TargetCalculator,
} from "@app/features/tables/business";

// UI components
export {
  MobileTable,
  TableContainer,
  TableHeader,
  TableHeaderCell,
  GoToExerciseButton,
  TargetHeader,
  AchievementBadge,
} from "@app/features/tables/ui";
export type {
  TableHeaderCellProps,
  TableHeaderCellResult,
  GoToExerciseButtonProps,
  TargetHeaderProps,
  AchievementBadgeProps,
  AchievementBadgeCallbacks,
  AchievementBadgeResult,
} from "@app/features/tables/ui";
