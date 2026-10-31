export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type CardPlacement =
  | { mode: "centered" }
  | { mode: "docked"; edge: "top" | "bottom" }
  | { mode: "floating"; left: number; top: number };

const GAP = 12;

/** A target counts as on screen when any part of it is inside the viewport. */
export function isInViewport(target: Box, viewport: Size): boolean {
  return (
    target.left + target.width > 0 &&
    target.top + target.height > 0 &&
    target.left < viewport.width &&
    target.top < viewport.height
  );
}

/**
 * Where the card goes. Desktop: below the target, above when there is no room,
 * centred when neither fits. Mobile: docked full width on the half opposite
 * the target so it never covers it.
 */
export function placeCard(
  target: Box | null,
  card: Size,
  viewport: Size,
  mobile: boolean,
): CardPlacement {
  if (!target) return { mode: "centered" };
  if (mobile) {
    const center = target.top + target.height / 2;
    return { mode: "docked", edge: center < viewport.height / 2 ? "bottom" : "top" };
  }
  const maxLeft = Math.max(GAP, viewport.width - card.width - GAP);
  const left = Math.min(Math.max(GAP, target.left), maxLeft);
  const below = target.top + target.height + GAP;
  if (below + card.height + GAP <= viewport.height) {
    return { mode: "floating", left, top: below };
  }
  const above = target.top - GAP - card.height;
  if (above >= GAP) return { mode: "floating", left, top: above };
  return { mode: "centered" };
}
