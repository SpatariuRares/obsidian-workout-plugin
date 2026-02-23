import { CodeGenerator } from "@app/features/modals/components/CodeGenerator";

export function generateDashboardBlock(): string {
  return CodeGenerator.generateDashboardCode();
}
