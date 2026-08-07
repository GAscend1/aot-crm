import { describe, expect, it } from "vitest";
import {
  computeTooltipPlacement,
  SIDEBAR_RIGHT,
  TOOLTIP_MARGIN,
} from "@/lib/tour-placement";

/**
 * Regression tests for the Product Tour sidebar tooltip bug: the tooltip used
 * to render at the same X as the highlighted sidebar item (hidden underneath /
 * covering the fixed sidebar). The engine must:
 * - never place the tooltip left of the fixed sidebar for sidebar targets,
 * - never leave the viewport (safe margin),
 * - prefer RIGHT → BOTTOM → TOP → LEFT for sidebar targets,
 * - prefer BOTTOM → RIGHT → TOP → LEFT for content targets,
 * - clamp into the viewport when nothing fits.
 */
describe("computeTooltipPlacement — sidebar targets (desktop, sidebar rendered)", () => {
  const sidebarTarget = { top: 240, left: 8, width: 204, height: 32 }; // a nav item
  const tooltip = { width: 360, height: 300 };
  // Desktop: the fixed sidebar (SIDEBAR_RIGHT) is rendered.
  const DESKTOP_SIDEBAR = SIDEBAR_RIGHT;

  it("prefers RIGHT and never overlaps the fixed sidebar (1440x900)", () => {
    const result = computeTooltipPlacement(
      sidebarTarget,
      tooltip.width,
      tooltip.height,
      1440,
      900,
      DESKTOP_SIDEBAR,
    );
    expect(result.placement).toBe("right");
    expect(result.left).toBeGreaterThanOrEqual(SIDEBAR_RIGHT + TOOLTIP_MARGIN);
    expect(result.left + tooltip.width).toBeLessThanOrEqual(1440 - TOOLTIP_MARGIN);
  });

  it("stays inside the viewport vertically with the safe margin", () => {
    const result = computeTooltipPlacement(
      sidebarTarget,
      tooltip.width,
      tooltip.height,
      1440,
      900,
      DESKTOP_SIDEBAR,
    );
    expect(result.top).toBeGreaterThanOrEqual(TOOLTIP_MARGIN);
    expect(result.top + tooltip.height).toBeLessThanOrEqual(900 - TOOLTIP_MARGIN);
  });

  it("falls back when there is no room on the right", () => {
    const target = { top: 300, left: 8, width: 204, height: 32 };
    const result = computeTooltipPlacement(target, 360, 300, 1024, 768, DESKTOP_SIDEBAR);
    // Never left of the sidebar, never off the right edge.
    expect(result.left).toBeGreaterThanOrEqual(SIDEBAR_RIGHT + TOOLTIP_MARGIN);
    expect(result.left + 360).toBeLessThanOrEqual(1024 - TOOLTIP_MARGIN + 1);
  });

  it("clamps into the viewport when the tooltip is larger than the screen", () => {
    const result = computeTooltipPlacement(
      sidebarTarget,
      500,
      400,
      480,
      360,
      DESKTOP_SIDEBAR,
    );
    expect(result.left).toBeGreaterThanOrEqual(0);
    expect(result.top).toBeGreaterThanOrEqual(0);
    expect(result.left).toBeLessThanOrEqual(480);
    expect(result.top).toBeLessThanOrEqual(360);
  });
});

describe("computeTooltipPlacement — narrow/mobile (no fixed sidebar rendered)", () => {
  it("does NOT push content targets right of an imaginary sidebar (regression)", () => {
    // Mobile viewport (375px), sidebar hidden → caller passes sidebarRight = 0.
    // A content target near the left edge must not be forced to left=235.
    const target = { top: 120, left: 8, width: 160, height: 36 };
    const result = computeTooltipPlacement(target, 360, 300, 375, 667, 0);
    expect(result.placement).toBe("bottom");
    expect(result.left).toBeLessThan(235);
    expect(result.left).toBeGreaterThanOrEqual(TOOLTIP_MARGIN);
    expect(result.left + 360).toBeLessThanOrEqual(375 + 1);
  });

  it("places a mid-left content target sensibly on a tablet viewport", () => {
    const target = { top: 300, left: 24, width: 200, height: 40 };
    const result = computeTooltipPlacement(target, 360, 300, 768, 1024, 0);
    // Bottom would clip the left edge (centered under a left-edge target), so
    // the engine flips to RIGHT; either way it must stay inside the viewport.
    expect(result.left).toBeGreaterThanOrEqual(TOOLTIP_MARGIN);
    expect(result.left + 360).toBeLessThanOrEqual(768 - TOOLTIP_MARGIN + 1);
    expect(result.top).toBeGreaterThanOrEqual(TOOLTIP_MARGIN);
    expect(result.top + 300).toBeLessThanOrEqual(1024 - TOOLTIP_MARGIN + 1);
  });

  it("keeps the tooltip inside a narrow viewport via clamping", () => {
    const target = { top: 400, left: 700, width: 60, height: 30 };
    const result = computeTooltipPlacement(target, 360, 300, 768, 1024, 0);
    expect(result.left + 360).toBeLessThanOrEqual(768 - TOOLTIP_MARGIN + 1);
    expect(result.left).toBeGreaterThanOrEqual(TOOLTIP_MARGIN);
  });
});

describe("computeTooltipPlacement — content targets", () => {
  it("prefers BOTTOM for dashboard/header/content controls", () => {
    const target = { top: 300, left: 500, width: 200, height: 40 };
    const result = computeTooltipPlacement(target, 360, 300, 1440, 900);
    expect(result.placement).toBe("bottom");
    expect(result.top).toBe(target.top + target.height + TOOLTIP_MARGIN);
  });

  it("switches to RIGHT when there is no room below (short viewport)", () => {
    // Bottom would go past the viewport bottom (900 - 300 - 14 = 586 < 700+40+14).
    const target = { top: 700, left: 500, width: 200, height: 40 };
    const result = computeTooltipPlacement(target, 360, 300, 1440, 900);
    expect(result.placement).toBe("right");
    expect(result.left).toBe(target.left + target.width + TOOLTIP_MARGIN);
  });

  it("keeps the tooltip fully inside the viewport on a vertically scrolled page", () => {
    // Simulate a control scrolled into view near the bottom of a 768-high
    // viewport: bottom doesn't fit, so the engine flips above (top) the target.
    const target = { top: 600, left: 400, width: 220, height: 36 };
    const result = computeTooltipPlacement(target, 360, 300, 1024, 768);
    expect(result.top + 300).toBeLessThanOrEqual(768 + 1);
    expect(result.left).toBeGreaterThanOrEqual(TOOLTIP_MARGIN);
  });

  it("clamps horizontally for a target near the right edge", () => {
    const target = { top: 200, left: 1300, width: 120, height: 36 };
    const result = computeTooltipPlacement(target, 360, 300, 1440, 900);
    expect(result.left + 360).toBeLessThanOrEqual(1440 - TOOLTIP_MARGIN + 1);
    expect(result.left).toBeGreaterThanOrEqual(TOOLTIP_MARGIN);
  });
});
