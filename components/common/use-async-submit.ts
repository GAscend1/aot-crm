"use client";

import { useCallback, useState } from "react";
import { ApiRequestError } from "@/repositories/api/ApiRepository";

/**
 * Wraps an async save handler with loading / error / field-error state.
 *
 * - Prevents duplicate submissions while a request is in flight.
 * - Surfaces the server's structured `fieldErrors` (from ApiRequestError) so
 *   forms can render errors next to the offending inputs.
 * - Does NOT close the form on success — callers decide when to close so the
 *   modal never disappears before the save actually succeeds.
 */
export function useAsyncSubmit(onSave: (data: never) => Promise<unknown>) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const submit = useCallback(
    async (data: never): Promise<boolean> => {
      if (saving) return false;
      setSaving(true);
      setError(null);
      setFieldErrors({});
      try {
        await onSave(data);
        return true;
      } catch (err) {
        if (err instanceof ApiRequestError) {
          setFieldErrors(err.fieldErrors ?? {});
          setError(err.message || "Something went wrong.");
        } else {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
        return false;
      } finally {
        setSaving(false);
      }
    },
    [onSave, saving]
  );

  return { saving, error, fieldErrors, submit };
}
