"use client";

import { useState } from "react";

import { DataTable } from "@/components/table/DataTable";

import { columns } from "../columns";
import { contacts } from "../data";
import { Contact } from "../types";

import { ContactDrawer } from "./ContactDrawer";
import { ContactDeleteDialog } from "./ContactDeleteDialog";

export function ContactTable() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | undefined>();

  function handleEdit(contact: Contact) {
    setSelectedContact(contact);
    setDrawerOpen(true);
  }

  function handleAdd() {
    setSelectedContact(undefined);
    setDrawerOpen(true);
  }

  function handleDelete(contact: Contact) {
    setContactToDelete(contact);
    setDeleteOpen(true);
  }

  function handleSave(contact: Contact) {
    console.log("Save contact:", contact);
    setDrawerOpen(false);
    setSelectedContact(undefined);
  }

  function handleConfirmDelete() {
    console.log("Delete contact:", contactToDelete?.id);
    setDeleteOpen(false);
    setContactToDelete(undefined);
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={contacts}
      />

      <ContactDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        contact={selectedContact}
        onSave={handleSave}
      />

      <ContactDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        contact={contactToDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
