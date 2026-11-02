import { sessionBlock } from "@app/features/session/sessionBlock";

export function generateSessionBlock(): string {
  return sessionBlock.serialize({});
}
