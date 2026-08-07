/**
 * Pure tooltip placement engine for the guided Product Tour.
 *
 * Collision-aware placement that:
 * - measures the tooltip's real width/height and the target's bounding rect,
 * - for LEFT SIDEBAR targets prefers RIGHT → BOTTOM → TOP → LEFT and clamps
 *   the X origin to the right of the fixed sidebar so the tooltip is never
 *   rendered underneath it,
 * - for all other targets prefers BOTTOM → RIGHT → TOP → LEFT,
 * - validates every candidate against the viewport with a safe margin and
 *   clamps the preferred placement when nothing fits,
 * - works for sidebar targets, header controls, dashboard content, and any
 *   control on a vertically scrolled page (fixed positioning uses the same
 *   getBoundingClientRect viewport-relative coordinates).
 *
 * Kept dependency-free so it can be unit-tested in node (no React).
 */

export type TooltipPlacement = "right" | "bottom" | "top" | "left";

export interface TooltipPlacementResult {
  top: number;
  left: number;
  placement: TooltipPlacement;
}

/** Safe viewport margin around the tooltip (spec: 12–16px). */
export const TOOLTIP_MARGIN = 14;

/** Right edge of the fixed desktop sidebar (220px + 1px border). */
export const SIDEBAR_RIGHT = 221;

/**
 * Targets whose left edge falls inside the sidebar region are treated as
 * sidebar targets (nav items, collapse control). Their tooltips must NEVER
 * render underneath the fixed sidebar.
 */
export const SIDEBAR_DETECT_LEFT = 240;

export type PlacementRectLike = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

export function computeTooltipPlacement(
  target: PlacementRectLike,
  tooltipWidth: number,
  tooltipHeight: number,
  viewportWidth: number,
  viewportHeight: number,
  sidebarRight = 0,
): TooltipPlacementResult {
  const M = TOOLTIP_MARGIN;
  // Only treat a target as a sidebar target when a fixed sidebar is actually
  // rendered to its left (the desktop sidebar is hidden below the Tailwind lg
  // breakpoint). Callers pass the measured sidebar right edge, or 0 when the
  // sidebar is hidden (mobile) so content targets are never pushed off-screen.
  const isSidebarTarget = sidebarRight > 0 && target.left < SIDEBAR_DETECT_LEFT;

  // Never overlap the fixed sidebar; otherwise keep the standard margin.
  const minX = isSidebarTarget ? sidebarRight + M : M;
  const maxX = viewportWidth - tooltipWidth - M;
  const minY = M;
  const maxY = viewportHeight - tooltipHeight - M;

  const orders: readonly TooltipPlacement[] = isSidebarTarget
    ? ["right", "bottom", "top", "left"]
    : ["bottom", "right", "top", "left"];

  const candidate = (placement: TooltipPlacement): { left: number; top: number } => {
    switch (placement) {
      case "right":
        return {
          left: target.left + target.width + M,
          top: target.top + target.height / 2 - tooltipHeight / 2,
        };
      case "left":
        return {
          left: target.left - tooltipWidth - M,
          top: target.top + target.height / 2 - tooltipHeight / 2,
        };
      case "top":
        return {
          left: target.left + target.width / 2 - tooltipWidth / 2,
          top: target.top - tooltipHeight - M,
        };
      case "bottom":
      default:
        return {
          left: target.left + target.width / 2 - tooltipWidth / 2,
          top: target.top + target.height + M,
        };
    }
  };

  for (const placement of orders) {
    const { left, top } = candidate(placement);
    if (left >= minX && left <= maxX && top >= minY && top <= maxY) {
      return { top, left, placement };
    }
  }

  // No placement fits cleanly — clamp the preferred placement into view.
  const preferred = candidate(orders[0]);
  return {
    top: clamp(preferred.top, minY, maxY),
    left: clamp(preferred.left, minX, maxX),
    placement: orders[0],
  };
}
