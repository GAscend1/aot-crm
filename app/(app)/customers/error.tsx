"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-4 p-6">
      <AlertTriangle className="h-12 w-12 text-red-500" />
      <h2 className="text-xl font-semibold">
        Something went wrong
      </h2>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        {error.message}
      </p>
      <Button onClick={reset}>
        Try Again
      </Button>
    </div>
  );
}
