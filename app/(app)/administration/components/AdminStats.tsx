"use client";

import { Shield, Users, Building2, UserCog } from "lucide-react";

import { StatCard } from "@/components/common/StatCard";
import { useApiList } from "@/hooks/use-api-list";

import { User } from "../types";

export function AdminStats() {
  const { data } = useApiList<User>("/api/admin/users?pageSize=1000");

  const active = data.filter((u) => u.status === "Active").length;
  const departments = new Set(data.map((u) => u.department).filter(Boolean)).size;
  const roles = new Set(data.map((u) => u.role)).size;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total Users"
        value={data.length}
        icon={Users}
      />

      <StatCard
        title="Active"
        value={active}
        icon={Shield}
      />

      <StatCard
        title="Departments"
        value={departments}
        icon={Building2}
      />

      <StatCard
        title="Roles"
        value={roles}
        icon={UserCog}
      />
    </div>
  );
}
