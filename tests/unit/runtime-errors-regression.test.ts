import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Static regression guards for the three React/Next.js runtime errors found
 * during real-browser Product Tour testing:
 *
 * ERROR A — AppSidebar: useSyncExternalStore's server snapshot returned a fresh
 *   `{}` literal every call → React "getServerSnapshot should be cached to
 *   avoid an infinite loop" warning. Snapshots must be referentially stable.
 *
 * ERROR B — NotificationCenter: the unread badge rendered on the client's
 *   first hydration pass but not on the server (initial notifications state was
 *   seeded from localStorage in the useState initializer) → hydration mismatch.
 *   Initial state must be deterministic; client-only data loads after mount.
 *
 * ERROR C — ProductTour: computeRect called el.scrollIntoView() on a stale
 *   DOM reference after a route change, and Chrome's scrollIntoView walks
 *   parentNode internally → "Cannot read properties of null (reading
 *   'parentNode')". Every target measurement must re-query + verify isConnected.
 */

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), "utf8");

describe("ERROR A — AppSidebar useSyncExternalStore snapshot stability", () => {
  const src = read("components/layout/AppSidebar.tsx");

  it("keeps useSyncExternalStore with a deterministic server snapshot", () => {
    expect(src).toContain("useSyncExternalStore(");
    expect(src).toContain("getServerGroups");
  });

  it("server snapshot returns a cached constant, never a fresh object literal", () => {
    // Regression: `return {};` produced a new reference per call → React
    // infinite-loop warning. It must return a single shared constant.
    expect(src).toContain("const EMPTY_GROUPS: Record<string, boolean> = {};");
    expect(src).toContain("function getServerGroups(): Record<string, boolean> {");
    expect(src).toContain("return EMPTY_GROUPS;");
    // Make sure no fresh-literal snapshot survived anywhere.
    expect(src).not.toMatch(/function getServerGroups[\s\S]*?return \{\};/);
  });

  it("pre-hydration client state shares the same stable constant", () => {
    // readGroupsSnapshot returns the module cache; the cache initializes to the
    // SAME constant the server snapshot returns, so the first client render
    // agrees with SSR (no mismatch, no instability).
    expect(src).toContain("let groupsCache: Record<string, boolean> = EMPTY_GROUPS;");
  });
});

describe("ERROR B — NotificationCenter deterministic initial state", () => {
  const src = read("hooks/use-synced-notifications.ts");

  it("initial notifications state is deterministic (empty), not localStorage-seeded", () => {
    // Regression: `useState(() => synchronizedNotificationService.getAll())`
    // read localStorage on the client's first render but returned [] on the
    // server → the unread badge differed → hydration mismatch.
    expect(src).toContain("useState<Notification[]>([])");
    expect(src).not.toContain(
      "useState<Notification[]>(() =>\n    synchronizedNotificationService.getAll()",
    );
  });

  it("loads server + local notifications after mount (functionality preserved)", () => {
    expect(src).toContain("fetchFromServer");
    expect(src).toContain("synchronizedNotificationService.subscribe(handleLocalUpdate)");
  });
});

describe("ERROR C — ProductTour target DOM lifecycle safety", () => {
  const src = read("components/onboarding/ProductTour.tsx");

  it("computeRect verifies the target is connected before geometry/scroll", () => {
    // Regression: scrollIntoView on a stale/detached element threw
    // "Cannot read properties of null (reading 'parentNode')".
    expect(src).toContain("if (!el || !el.isConnected) return null;");
    expect(src).toContain("el.getBoundingClientRect()");
  });

  it("re-queries the target fresh on every measurement (no stale references)", () => {
    // The effect must resolve the target per measurement instead of capturing
    // one element for the rAF/timeout/resize handlers.
    expect(src).toContain("const getTarget = (): Element | null => {");
    expect(src).toContain("document.querySelector(step.target)");
    expect(src).toContain("el && el.isConnected ? el : null");
  });

  it("keeps cleanup idempotent (rAF + timer + resize all removed)", () => {
    expect(src).toContain("window.cancelAnimationFrame(frame);");
    expect(src).toContain("window.clearTimeout(timer);");
    expect(src).toContain("window.removeEventListener(\"resize\", onResize);");
  });

  it("renders the tooltip as a direct dialog child (no createPortal race)", () => {
    // The tooltip was previously portaled to document.body — outside the
    // [role=dialog] element (aria-modal containment) and subject to
    // mount/unmount races on step changes. position:fixed needs no portal.
    expect(src).not.toMatch(/import \{ createPortal \} from "react-dom"/);
    expect(src).not.toMatch(/import \{ createPortal \} from 'react-dom'/);
    expect(src).toMatch(/DIRECT child of the dialog/);
  });
});

describe("ERROR D — DataTable render-phase state update (React 19)", () => {
  const src = read("components/table/DataTable.tsx");

  it("passes a referentially-stable memoized state object to useReactTable", () => {
    // Inline `state: { ... }` literals create a new reference every render,
    // which TanStack diffs and can react to during render.
    expect(src).toContain("const tableState = React.useMemo(");
    expect(src).toMatch(/state: tableState,/);
  });

  it("disables autoResetPageIndex (TanStack reset calls setState during render)", () => {
    // Captured live stack: resetPageIndex → setPagination → onPaginationChange
    // → setState DURING render when data identity changes → React 19
    // "hasn't mounted yet" warning. autoResetPageIndex:false is the fix.
    expect(src).toContain("autoResetPageIndex: false");
  });
});

describe("Trial banner — no stale 14-day constants in product code", () => {
  it("TRIAL_DURATION_DAYS defaults to 7 with env override", () => {
    const tenant = read("lib/server/tenant.ts");
    expect(tenant).toMatch(/Number\(process\.env\.TRIAL_DURATION_DAYS \|\| 7\)/);
    expect(tenant).not.toMatch(/Number\(process\.env\.TRIAL_DURATION_DAYS \|\| 14\)/);
  });

  it("trial banner consumes authoritative subscription state (no hard-coded 7/14)", () => {
    const banner = read("components/subscription/TrialBanner.tsx");
    expect(banner).toContain("data.trialDaysRemaining");
    expect(banner).not.toMatch(/14 day/);
  });
});
