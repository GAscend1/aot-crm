"use client";

import { useEffect, useRef } from "react";

/**
 * Returns a ref whose `.current` is `true` while the component is mounted and
 * `false` after unmount. Use it to guard async callbacks that call setState
 * after awaiting (e.g. `service.findAll().then((r) => setRows(r.data))`).
 *
 * This is the root-cause fix for the "state update on unmounted component"
 * class of React regressions that repeatedly appeared in module tables.
 */
export function useMountedRef(): React.MutableRefObject<boolean> {
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  return mountedRef;
}
