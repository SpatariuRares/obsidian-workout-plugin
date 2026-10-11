import { durationBlock } from "@app/features/duration/durationBlock";

export function generateDurationBlock(): string {
  return durationBlock.serialize({});
}
