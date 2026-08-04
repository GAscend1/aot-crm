"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { DataTable } from "@/components/table/DataTable";
import { useToastContext } from "@/app/(app)/AppProviders";

import { createColumns } from "../columns";
import { companyService } from "@/services/index";
import type { Company } from "@/services/company.service";
import { CompanyModal } from "./CompanyModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { CompanyToolbar } from "./CompanyToolbar";
import { CompanyWorkspace } from "./CompanyWorkspace";

export function CompanyTable() {
  const router = useRouter();
  const { success, error: showError } = useToastContext();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<Company | undefined>();

  useEffect(() => {
    companyService
      .findAll()
      .then((result) => {
        setCompanies(result.data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load companies.");
        setLoading(false);
      });
  }, []);

  const industries = useMemo(
    () => [...new Set(companies.map((c) => c.industry))],
    [companies],
  );

  const filtered = useMemo(() => {
    let result = companies;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.industry.toLowerCase().includes(q),
      );
    }

    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (industryFilter) {
      result = result.filter((c) => c.industry === industryFilter);
    }

    return result;
  }, [companies, searchQuery, statusFilter, industryFilter]);

  const handleEdit = useCallback((company: Company) => {
    setEditingCompany(company);
    setModalOpen(true);
  }, []);

  const handleView = useCallback(
    (company: Company) => {
      router.push(`/companies?record=${encodeURIComponent(company.id)}`, {
        scroll: false,
      });
    },
    [router],
  );

  const handleDelete = useCallback((company: Company) => {
    setDeletingCompany(company);
    setDeleteDialogOpen(true);
  }, []);

  const handleRowClick = useCallback(
    (company: Company) => {
      router.push(`/companies?record=${encodeURIComponent(company.id)}`, {
        scroll: false,
      });
    },
    [router],
  );

  const columns = useMemo(
    () => createColumns({ onView: handleView, onEdit: handleEdit, onDelete: handleDelete }),
    [handleView, handleEdit, handleDelete],
  );

  const handleSave = useCallback(
    async (data: Company) => {
      try {
        if (editingCompany) {
          const updated = await companyService.update(editingCompany.id, data as Partial<Company>);
          setCompanies((prev) =>
            prev.map((c) => (c.id === editingCompany.id ? updated : c)),
          );
          success("Company updated", `${updated.name} has been updated.`);
        } else {
          const created = await companyService.create(data as Omit<Company, "id" | "createdAt" | "updatedAt">);
          setCompanies((prev) => [created, ...prev]);
          success("Company created", `${created.name} has been added.`);
        }
        setModalOpen(false);
        setEditingCompany(undefined);
      } catch (err) {
        showError("Error", "Failed to save company.");
        throw err;
      }
    },
    [editingCompany, success, showError],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingCompany) return;
    const target = deletingCompany;
    const previous = companies;
    // Optimistic removal; restored if the API call fails.
    setCompanies((prev) => prev.filter((c) => c.id !== target.id));
    setDeleteDialogOpen(false);
    setDeletingCompany(undefined);
    try {
      await companyService.delete(target.id);
      success("Company archived", `${target.name} has been archived.`);
    } catch {
      setCompanies(previous);
      showError("Error", "Failed to archive company.");
    }
  }, [companies, deletingCompany, success, showError]);

  const handleAdd = useCallback(() => {
    setEditingCompany(undefined);
    setModalOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await companyService.findAll();
      setCompanies(result.data);
    } catch {
      setError("Failed to load companies.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBulkAction = useCallback(
    async (action: string, rows: Company[]) => {
      if (action === "delete") {
        for (const row of rows) {
          await companyService.delete(row.id);
        }
        setCompanies((prev) =>
          prev.filter((c) => !rows.find((r) => r.id === c.id)),
        );
        success("Archived", `${rows.length} company(ies) archived.`);
      } else if (action === "export") {
        const csv = [
          "Name,Industry,City,Status,Revenue,Created",
          ...rows.map(
            (r) =>
              `${r.name},${r.industry},${r.city},${r.status},${r.revenue},${r.createdAt}`,
          ),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "companies.csv";
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [success],
  );

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        error={error}
        onRetry={handleRefresh}
        enableRowSelection={true}
        onRowClick={handleRowClick}
        onBulkAction={handleBulkAction}
        toolbar={
          <CompanyToolbar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            filters={{
              status: (statusFilter || "all") as Company["status"] | "all",
              industry: industryFilter || "all",
            }}
            onFilterChange={({ status, industry }) => {
              setStatusFilter(status === "all" ? "" : status);
              setIndustryFilter(industry === "all" ? "" : industry);
            }}
            industries={industries}
            onAdd={handleAdd}
            onRefresh={handleRefresh}
          />
        }
      />

      <CompanyModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCompany(undefined);
        }}
        company={editingCompany}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingCompany(undefined);
        }}
        title="Archive Company"
        message={
          <>
            Archive <strong>{deletingCompany?.name}</strong>? This will remove
            the company from active lists while keeping linked records intact.
          </>
        }
        confirmLabel="Archive"
        variant="danger"
        onConfirm={handleConfirmDelete}
      />

      <CompanyWorkspace
        onChanged={() => {
          companyService.findAll().then((result) => {
            setCompanies(result.data);
          });
        }}
      />
    </div>
  );
}
