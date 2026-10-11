import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";

export function generateDashboardBlock(): string {
  return dashboardBlock.serialize({});
}
