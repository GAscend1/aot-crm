"use client";

import { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  X,
  Download,
  Trash2,
  FileIcon,
  FileImage,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fileManagementService } from "@/services/file-management.service";
import type { FileItem } from "@/types/common";

interface FilePreviewProps {
  file: FileItem;
  open: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

function getFileIcon(type: FileItem["type"]) {
  switch (type) {
    case "image": return FileImage;
    case "pdf": return FileText;
    case "office": return FileSpreadsheet;
    default: return FileIcon;
  }
}

export function FilePreview({ file, open, onClose, onDelete }: FilePreviewProps) {
  const [deleting, setDeleting] = useState(false);
  const Icon = getFileIcon(file.type);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fileManagementService.delete(file.id);
      onDelete?.(file.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 supports-backdrop-filter:backdrop-blur-sm data-ending-style:opacity-0 data-starting-style:opacity-0 transition-opacity duration-150" />
        <DialogPrimitive.Popup className="fixed inset-0 z-50 flex items-center justify-center p-4 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95 transition-all duration-150">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border bg-white shadow-2xl dark:bg-slate-950 dark:border-slate-800">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="h-5 w-5 shrink-0 text-slate-500" />
                <span className="text-sm font-medium truncate text-slate-900 dark:text-white">
                  {file.name}
                </span>
                <span className="text-xs text-slate-400 shrink-0">{formatSize(file.size)}</span>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href={file.url}
                  download={file.name}
                  className="inline-flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Download className="h-4 w-4" />
                </a>
                {onDelete && (
                  <Button variant="ghost" size="icon-sm" onClick={handleDelete} disabled={deleting}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
                <DialogPrimitive.Close render={<Button variant="ghost" size="icon-sm" />}>
                  <X className="h-4 w-4" />
                </DialogPrimitive.Close>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {file.type === "image" && (
                <img
                  src={file.url}
                  alt={file.name}
                  className="mx-auto max-h-[70vh] rounded-lg object-contain"
                />
              )}
              {file.type === "pdf" && (
                <iframe
                  src={file.url}
                  className="h-[70vh] w-full rounded-lg"
                  title={file.name}
                />
              )}
              {(file.type === "office" || file.type === "other") && (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-slate-400">
                  <Icon className="h-16 w-16" />
                  <p className="text-sm">Preview not available for {file.mimeType}</p>
                  <a
                    href={file.url}
                    download={file.name}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    <Download className="h-4 w-4" />
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
