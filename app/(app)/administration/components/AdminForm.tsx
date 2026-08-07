"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Department, Team, User, UserStatus } from "../types";

const roles = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "SALES_MANAGER", label: "Sales Manager" },
  { value: "SALES", label: "Sales" },
  { value: "SUPPORT_MANAGER", label: "Support Manager" },
  { value: "SUPPORT", label: "Support" },
  { value: "HR_MANAGER", label: "HR Manager" },
  { value: "HR", label: "HR" },
  { value: "VIEWER", label: "Viewer" },
];

const departments: Department[] = [
  "Sales", "Support", "HR", "Engineering", "Marketing", "Finance",
];

const teams: Team[] = [
  "Alpha", "Beta", "Gamma", "Delta", "Epsilon",
];

const statuses: UserStatus[] = [
  "Active", "Inactive", "Suspended",
];

interface AdminFormProps {
  initialData?: User;
  onSubmit: (data: User) => Promise<void> | void;
  onCancel: () => void;
}

export function AdminForm({
  initialData,
  onSubmit,
  onCancel,
}: AdminFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>(initialData?.role ?? "VIEWER");
  const [department, setDepartment] = useState<Department>(
    initialData?.department ?? "Engineering"
  );
  const [team, setTeam] = useState<Team>(initialData?.team ?? "Alpha");
  const [status, setStatus] = useState<UserStatus>(
    initialData?.status ?? "Active"
  );
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({
        id: initialData?.id ?? crypto.randomUUID(),
        name,
        email,
        role: role as User["role"],
        department,
        team,
        status,
        lastLogin: initialData?.lastLogin ?? new Date().toISOString(),
        createdAt: initialData?.createdAt ?? new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      });
    } finally {
      setSubmitting(false);
    }
  }

  const isEditing = !!initialData;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Full Name
          </label>

          <Input
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Email
          </label>

          <Input
            type="email"
            placeholder="john@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {!isEditing && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Password
          </label>

          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Role
          </label>

          <Select value={role} onValueChange={(v) => setRole(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Department
          </label>

          <Select
            value={department}
            onValueChange={(v) => setDepartment(v as Department)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Team
          </label>

          <Select
            value={team}
            onValueChange={(v) => setTeam(v as Team)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {teams.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Status
          </label>

          <Select
            value={status}
            onValueChange={(v) => setStatus(v as UserStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>

        <Button onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting ? "Saving..." : isEditing ? "Save Changes" : "Create User"}
        </Button>
      </div>
    </div>
  );
}
