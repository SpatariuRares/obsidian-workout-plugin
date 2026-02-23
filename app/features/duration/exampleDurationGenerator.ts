import { CodeGenerator } from "@app/features/modals/components/CodeGenerator";

export function generateDurationBlock(): string {
  return CodeGenerator.generateDurationCode();
}
