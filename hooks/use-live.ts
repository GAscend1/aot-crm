"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { eventBus } from "@/services/event-bus";

export function useLive<T>(
  fetcher: () => T | Promise<T>,
  events: string[],
  defaultValue: T
): { data: T; refresh: () => void; isSynced: boolean } {
  const [data, setData] = useState<T>(defaultValue);
  const [version, setVersion] = useState(0);
  const mountedRef = useRef(true);

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const run = async () => {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
      }
    };
    run();
    const unsubscribes = events.map((event) =>
      eventBus.on(event, () => {
        if (mountedRef.current) {
          run();
        }
      })
    );
    return () => {
      mountedRef.current = false;
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [version]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, refresh, isSynced: true };
}
