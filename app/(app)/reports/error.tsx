"use client";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({
  error,
  reset,
}: ErrorProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">
        Something went wrong
      </h2>

      <p className="text-sm text-muted-foreground">
        {error.message}
      </p>

      <button
        onClick={reset}
        className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
      >
        Try Again
      </button>
    </div>
  );
}
