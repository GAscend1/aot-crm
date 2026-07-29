"use client";

import { useEffect } from "react";
import { ensureEventWiring } from "@/services/event-wiring";
import { synchronizedActivityService } from "@/services/synchronized-activity.service";
import { synchronizedNotificationService } from "@/services/synchronized-notification.service";

export function AppEventBridge() {
  useEffect(() => {
    ensureEventWiring();
  }, []);

  return null;
}
