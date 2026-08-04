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
