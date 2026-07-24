"use client";

import { Plus } from "lucide-react";

import { ModuleToolbar } from "@/components/common/ModuleToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CompanyToolbar() {
  return (
    <ModuleToolbar
      search={
        <Input
          placeholder="Search companies..."
          className="w-80"
        />
      }
      actions={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Company
        </Button>
      }
    />
  );
}