"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Upload,
  Download,
  Trash2,
  FileIcon,
  FileImage,
  FileText,
  FileSpreadsheet,
  Eye,
  RefreshCw,
  ArrowUpFromLine,
} from "lucide-react";
import { PageLayout } from "@/components/common/PageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { FilePreview } from "@/components/enterprise/FilePreview";
import { fileManagementService } from "@/services/file-management.service";
import type { FileItem } from "@/types/common";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIconDisplay({ type, className }: { type: FileItem["type"]; className?: string }) {
  switch (type) {
    case "image": return <FileImage className={className} />;
    case "pdf": return <FileText className={className} />;
    case "office": return <FileSpreadsheet className={className} />;
    default: return <FileIcon className={className} />;
  }
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fileManagementService.getAll().then((items) => {
      setFiles(items);
      setLoading(false);
    });
  }, []);

  const handleUpload = async (fileList: FileList) => {
    const fileArray = Array.from(fileList);
    await fileManagementService.uploadMultiple(fileArray);
    const items = await fileManagementService.getAll();
    setFiles(items);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      await handleUpload(e.dataTransfer.files);
    }
  };

  const handleDelete = async (id: string) => {
    await fileManagementService.delete(id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDownload = (file: FileItem) => {
    const a = document.createElement("a");
    a.href = file.url;
    a.download = file.name;
    a.click();
  };

  return (
    <PageLayout
      title="File Manager"
      description="Upload, preview, and manage your files."
      actions={
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
            />
          </label>
          <Button variant="outline" size="icon" onClick={() => {
            setLoading(true);
            fileManagementService.getAll().then((items) => {
              setFiles(items);
              setLoading(false);
            });
          }}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {dragOver && (
          <div className="mb-4 flex items-center justify-center rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 py-12 dark:bg-blue-950/20">
            <div className="flex flex-col items-center gap-2 text-blue-600 dark:text-blue-300">
              <ArrowUpFromLine className="h-8 w-8" />
              <p className="text-sm font-medium">Drop files to upload</p>
            </div>
          </div>
        )}

        {loading ? (
          <LoadingState />
        ) : files.length === 0 ? (
          <EmptyState
            title="No files uploaded"
            description="Upload your first file by clicking the Upload button or dragging files here."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {files.map((file) => (
              <Card key={file.id} className="group relative">
                <CardContent className="p-0">
                  {file.type === "image" ? (
                    <div className="relative aspect-video overflow-hidden rounded-t-xl">
                      <Image
                        src={file.thumbnailUrl || file.url}
                        alt={file.name}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                        <Button size="icon-sm" variant="secondary" onClick={() => setPreviewFile(file)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon-sm" variant="secondary" onClick={() => handleDownload(file)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="icon-sm" variant="secondary" onClick={() => handleDelete(file.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-slate-50 dark:bg-slate-800">
                      <FileIconDisplay type={file.type} className="h-12 w-12 text-slate-300" />
                    </div>
                  )}
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{file.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{formatSize(file.size)}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {file.type !== "image" && (
                          <Button variant="ghost" size="icon-xs" onClick={() => setPreviewFile(file)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon-xs" onClick={() => handleDownload(file)}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(file.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {previewFile && (
        <FilePreview
          file={previewFile}
          open={!!previewFile}
          onClose={() => setPreviewFile(null)}
          onDelete={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
        />
      )}
    </PageLayout>
  );
}