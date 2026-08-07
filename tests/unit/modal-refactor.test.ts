import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const APP_ROOT = join(process.cwd(), "app", "(app)");

const CRM_MODULES = [
  "activities",
  "administration",
  "companies",
  "contacts",
  "customers",
  "documents",
  "invoices",
  "leads",
  "opportunities",
  "quotes",
  "reports",
  "tickets",
];

/** CRUD modal per module — the component that replaced the old right-side Drawer. */
const MODULE_MODALS: Record<string, string> = {
  activities: "ActivityModal",
  administration: "AdminModal",
  companies: "CompanyModal",
  contacts: "ContactModal",
  customers: "CustomerModal",
  documents: "DocumentModal",
  invoices: "InvoiceModal",
  leads: "LeadModal",
  opportunities: "OpportunityModal",
  quotes: "QuoteModal",
  reports: "ReportModal",
  tickets: "TicketModal",
};

function walk(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walk(full));
    } else if (full.endsWith(".tsx") || full.endsWith(".ts")) {
      results.push(full);
    }
  }
  return results;
}

function read(file: string): string {
  return readFileSync(file, "utf8");
}

function relPaths(paths: string[]): string[] {
  return paths.map((p) => relative(process.cwd(), p).replaceAll("\\", "/")).sort();
}

const allFiles = walk(APP_ROOT);

describe("CRM modal refactor (Drawer → RecordModal, DeleteDialog → ConfirmDialog)", () => {
  it("contains no legacy *Drawer.tsx component files", () => {
    const legacy = allFiles.filter((f) => f.endsWith("Drawer.tsx"));
    expect(relPaths(legacy)).toEqual([]);
  });

  it("contains no legacy *DeleteDialog.tsx component files", () => {
    const legacy = allFiles.filter((f) => f.endsWith("DeleteDialog.tsx"));
    expect(relPaths(legacy)).toEqual([]);
  });

  it("has no imports of the right-side Sheet drawer primitive (@/components/ui/sheet)", () => {
    const offenders = allFiles.filter((f) =>
      read(f).includes('from "@/components/ui/sheet"')
    );
    expect(relPaths(offenders)).toEqual([]);
  });

  it("has no imports of local *Drawer / *DeleteDialog components", () => {
    const importRe = /from\s+["'][^"']*(?:Drawer|DeleteDialog)["']/;
    const offenders = allFiles.filter((f) => importRe.test(read(f)));
    expect(relPaths(offenders)).toEqual([]);
  });

  it("every CRM module has its CRUD modal built on RecordModal", () => {
    for (const mod of CRM_MODULES) {
      const modalFile = MODULE_MODALS[mod];
      const modalPath = join(APP_ROOT, mod, "components", modalFile + ".tsx");

      expect(modalPath, `${mod} exposes ${modalFile}.tsx`).toSatisfy((p: string) =>
        existsSync(p)
      );
      const src = read(modalPath);
      expect(
        src,
        `${mod}/${modalFile} wraps @/components/common/RecordModal`
      ).toContain('from "@/components/common/RecordModal"');
    }
  });

  it("every module Table and Workspace uses the shared ConfirmDialog", () => {
    for (const mod of CRM_MODULES) {
      const componentsDir = join(APP_ROOT, mod, "components");
      for (const file of readdirSync(componentsDir)) {
        if (/Table\.tsx$/.test(file) || /Workspace\.tsx$/.test(file)) {
          const src = read(join(componentsDir, file));
          expect(
            src,
            `${mod}/${file} uses ConfirmDialog for destructive confirmations`
          ).toContain("ConfirmDialog");
        }
      }
    }
  });
});

describe("Record workspace close-control invariants (single X per dialog)", () => {
  const recordWorkspaceSrc = read(join(process.cwd(), "components", "enterprise", "RecordWorkspace.tsx"));
  const oppHeaderSrc = read(join(APP_ROOT, "opportunities", "components", "OpportunityWorkspaceHeader.tsx"));
  const oppWorkspaceSrc = read(join(APP_ROOT, "opportunities", "components", "OpportunityWorkspace.tsx"));
  const dialogSrc = read(join(process.cwd(), "components", "ui", "dialog.tsx"));

  it("RecordWorkspace suppresses the shell close button when a custom header owns it", () => {
    // The shadcn DialogContent renders an absolute top-right X by default.
    expect(dialogSrc).toContain("showCloseButton = true");
    // RecordWorkspace must forward a showCloseButton that is FALSE when a
    // custom header (which renders its own X) is supplied.
    expect(recordWorkspaceSrc).toMatch(/showCloseButton=\{effectiveShowCloseButton\}/);
    expect(recordWorkspaceSrc).toMatch(/const effectiveShowCloseButton = header/);
    expect(recordWorkspaceSrc).toContain("(showCloseButton ?? false)");
  });

  it("OpportunityWorkspace passes a custom header (so the shell X is suppressed)", () => {
    expect(oppWorkspaceSrc).toMatch(/<RecordWorkspace[\s\S]*?header=\{/);
  });

  it("OpportunityWorkspaceHeader renders exactly ONE aria-label=Close button", () => {
    const closeButtons = oppHeaderSrc.match(/aria-label="Close"/g) ?? [];
    expect(closeButtons).toHaveLength(1);
  });

  it("no nested opportunity dialog renders more than one close X", () => {
    const nested = [
      "CreateQuoteModal.tsx",
      "CreateInvoiceModal.tsx",
      "AddActivityDialog.tsx",
      "AssignOpportunityDialog.tsx",
      "UploadDocumentDialog.tsx",
      "EditOpportunityDialog.tsx",
    ];
    for (const file of nested) {
      const src = read(join(APP_ROOT, "opportunities", "components", file));
      const xs = src.match(/<DialogPrimitive\.Close/g) ?? [];
      expect(xs, `${file} has exactly one DialogPrimitive.Close`).toHaveLength(1);
    }
  });
});

describe("Record workspace viewport invariants (no bottom clipping)", () => {
  const src = read(join(process.cwd(), "components", "enterprise", "RecordWorkspace.tsx"));

  it("gives the dialog a definite, viewport-capped height so the body scrolls", () => {
    // Regression guard: `h-auto` + `max-h` with minmax(0,1fr) grid rows made
    // the body row size to its content; the overflow-hidden shell then CLIPPED
    // the lower content/buttons instead of scrolling. A definite capped height
    // keeps the row bounded and the inner scroll regions functional.
    expect(src).toContain("sm:h-[min(86dvh,900px)]");
    expect(src).toContain("sm:h-[min(90dvh,900px)]");
    expect(src).toContain("grid-rows-[auto_minmax(0,1fr)]");
    expect(src).toContain("max-h-dvh");
  });

  it("never uses the broken two-column grid on the default layout", () => {
    // sm:grid-cols-[1fr_auto] mis-placed the body into a narrow auto column.
    expect(src).not.toContain("sm:grid-cols-[1fr_auto]");
  });

  it("keeps header actions clear of the single shell close X", () => {
    expect(src).toContain("pr-14");
  });

  it("split inspector column scrolls independently when taller than the dialog", () => {
    expect(src).toContain("lg:overflow-y-auto");
  });
});
