import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import { generateCodeBlockId } from "@app/utils/IdUtils";

export function generateDashboardBlock(): string {
  return dashboardBlock.serialize({ id: generateCodeBlockId() });
}
