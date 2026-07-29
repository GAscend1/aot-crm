"use client";

import { useEffect } from "react";
import { ensureEventWiring } from "@/services/event-wiring";

export function AppEventBridge() {
  useEffect(() => {
    ensureEventWiring();
  }, []);

  return null;
}
