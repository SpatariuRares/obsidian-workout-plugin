/**
 * Molecules Index
 * Barrel export for all molecule components
 */

// Priority 1 Molecules
export {
  StatCard,
  type StatCardProps,
} from "@app/components/molecules/StatCard";
export {
  ActionButtonGroup,
  type ActionButtonGroupProps,
  type ActionButtonGroupResult,
} from "@app/components/molecules/ActionButtonGroup";
export {
  TrendIndicator,
  type TrendIndicatorProps,
} from "@app/components/molecules/TrendIndicator";

// Priority 2 Molecules
export {
  FormField,
  type FormFieldProps,
  type FormFieldResult,
} from "@app/components/molecules/FormField";
export {
  SearchBox,
  type SearchBoxProps,
  type SearchBoxResult,
} from "@app/components/molecules/SearchBox";
export { Badge, type BadgeProps } from "@app/components/molecules/Badge";
export {
  LoadingSpinner,
  type LoadingSpinnerProps,
} from "@app/components/molecules/LoadingSpinner";

// Priority 3 Molecules
// ChartLegendItem moved to @app/features/charts/ui
export {
  ChartLegendItem,
  type ChartLegendItemProps,
} from "@app/features/charts/ui/ChartLegendItem";
export {
  FilterIndicator,
  type FilterIndicatorProps,
} from "@app/components/molecules/FilterIndicator";
export {
  CopyableBadge,
  type CopyableBadgeProps,
} from "@app/components/molecules/CopyableBadge";
export {
  ListItem,
  type ListItemProps,
  type ListContainerProps,
  type TextItemProps,
  type StatItemProps,
} from "@app/components/molecules/ListItem";
