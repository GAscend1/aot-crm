"use client";

import { Plus } from "lucide-react";

import { ModuleToolbar } from "@/components/common/ModuleToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ContactFilters } from "./ContactFilters";

export function ContactToolbar() {
  return (
    <ModuleToolbar
      search={
        <Input
          placeholder="Search contacts..."
          className="w-80"
        />
      }
      filters={<ContactFilters />}
      actions={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      }
    />
  );
}
