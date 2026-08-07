"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  CheckCircle2, XCircle, Loader2, RefreshCw, AlertTriangle,
  Mail, Calendar, Video, User, Camera, Radio, Shield, Wifi,
} from "lucide-react";
import { PageLayout } from "@/components/common/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { IntegrationStateBanner } from "@/components/common/IntegrationStateBanner";
import type { IntegrationStatus } from "@/services/integration-gate";

type CapabilityState = "loading" | "ok" | "error" | "unknown";

interface CapabilityResult {
  name: string;
  icon: React.ElementType;
  state: CapabilityState;
  detail: string;
}

const STATE_TONE: Record<IntegrationStatus["state"], { label: string; dot: string }> = {
  CONNECTED: { label: "Connected", dot: "bg-[color:var(--success)]" },
  SIGN_IN_REQUIRED: { label: "Sign in required", dot: "bg-[color:var(--warning)]" },
  RECONSENT_REQUIRED: { label: "Consent required", dot: "bg-[color:var(--warning)]" },
  TOKEN_EXPIRED: { label: "Session expired", dot: "bg-[color:var(--warning)]" },
  CONFIGURATION_ERROR: { label: "Not configured", dot: "bg-[color:var(--danger)]" },
  GRAPH_UNAVAILABLE: { label: "Unavailable", dot: "bg-[color:var(--danger)]" },
  NOT_CONFIGURED: { label: "Not configured", dot: "bg-[color:var(--warning)]" },
};

export function MicrosoftIntegrationClient() {
  const { data: session } = useSession();
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [capabilities, setCapabilities] = useState<CapabilityResult[]>([
    { name: "Profile", icon: User, state: "unknown", detail: "" },
    { name: "Photo", icon: Camera, state: "unknown", detail: "" },
    { name: "Presence", icon: Radio, state: "unknown", detail: "" },
    { name: "Mail Send", icon: Mail, state: "unknown", detail: "" },
    { name: "Mailbox", icon: Mail, state: "unknown", detail: "" },
    { name: "Calendar", icon: Calendar, state: "unknown", detail: "" },
    { name: "Teams Meeting", icon: Video, state: "unknown", detail: "" },
  ]);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/microsoft/status", { cache: "no-store" });
      if (!res.ok) throw new Error("Status unavailable");
      const data = (await res.json()) as IntegrationStatus;
      setStatus(data);
    } catch {
      setStatus({
        state: "GRAPH_UNAVAILABLE",
        enabled: false,
        provider: "mock",
        title: "Status unavailable",
        message: "Could not reach the integration status endpoint.",
        action: "retry",
        checkedAt: new Date().toISOString(),
      });
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const runTest = useCallback(async (index: number, fetcher: () => Promise<unknown>) => {
    setCapabilities((prev) => prev.map((c, i) => i === index ? { ...c, state: "loading" as const, detail: "Testing..." } : c));
    try {
      await fetcher();
      setCapabilities((prev) => prev.map((c, i) => i === index ? { ...c, state: "ok" as const, detail: "Connected" } : c));
    } catch (err) {
      setCapabilities((prev) => prev.map((c, i) => i === index ? {
        ...c, state: "error" as const,
        detail: err instanceof Error ? err.message : "Connection failed",
      } : c));
    }
  }, []);

  const testAll = useCallback(async () => {
    setTesting(true);

    await runTest(0, () => fetch("/api/integrations/microsoft/profile").then((r) => { if (!r.ok) throw new Error("Profile unavailable"); return r.json(); }));
    await runTest(1, () => fetch("/api/integrations/microsoft/photo").then((r) => { if (!r.ok && r.status !== 404) throw new Error("Photo unavailable"); }));
    await runTest(2, () => fetch("/api/integrations/microsoft/presence").then((r) => { if (!r.ok) throw new Error("Presence unavailable"); return r.json(); }));
    await runTest(3, () => fetch("/api/integrations/microsoft/mail/messages?folder=inbox&$top=1").then((r) => { if (!r.ok) throw new Error("Mailbox unavailable"); return r.json(); }));
    await runTest(4, () => fetch("/api/integrations/microsoft/calendar/events?$top=1").then((r) => { if (!r.ok) throw new Error("Calendar unavailable"); return r.json(); }));

    setTesting(false);
  }, [runTest]);

  const stateColors: Record<CapabilityState, string> = {
    loading: "text-amber-500",
    ok: "text-green-500",
    error: "text-red-500",
    unknown: "text-slate-400",
  };

  const stateIcons: Record<CapabilityState, React.ElementType> = {
    loading: Loader2,
    ok: CheckCircle2,
    error: XCircle,
    unknown: AlertTriangle,
  };

  const tone = status ? STATE_TONE[status.state] : null;
  const live = status?.state === "CONNECTED";

  return (
    <PageLayout
      title="Microsoft 365 Integration Status"
      description="View the current status of your Microsoft 365 integration and test connectivity."
    >
      <div className="space-y-6">
        {status && status.state !== "CONNECTED" && (
          <IntegrationStateBanner status={status} onRetry={() => void loadStatus()} />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Provider Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 pb-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${live ? "bg-green-100 text-green-600 dark:bg-green-900/30" : status ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30" : "bg-red-100 text-red-600 dark:bg-red-900/30"}`}>
                <Wifi className="h-5 w-5" />
              </div>
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white">
                  {tone && <span className={`h-2 w-2 rounded-full ${tone.dot}`} aria-hidden="true" />}
                  {tone?.label ?? "Checking..."}
                </p>
                <p className="text-xs text-slate-500">
                  {status?.message ?? "Loading provider status..."}
                </p>
                {status?.detail && (
                  <p className="mt-0.5 text-[11px] text-slate-400">{status.detail}</p>
                )}
              </div>
            </div>

            {session?.user && (
              <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                <p className="text-xs text-slate-500">Signed in as</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {session.user.name || session.user.email}
                </p>
                <p className="text-xs text-slate-500">{session.user.email}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5" />
              Capability Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 divide-y dark:divide-slate-800">
              {capabilities.map((cap) => {
                const StateIcon = stateIcons[cap.state];
                return (
                  <div key={cap.name} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <cap.icon className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{cap.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {cap.state !== "unknown" && (
                        <span className="text-xs text-slate-500">{cap.detail}</span>
                      )}
                      <StateIcon className={`h-4 w-4 ${stateColors[cap.state]} ${cap.state === "loading" ? "animate-spin" : ""}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={testAll} disabled={testing || !live}>
            {testing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</>
            ) : (
              <><RefreshCw className="mr-2 h-4 w-4" /> Test Connection</>
            )}
          </Button>

          {live && (
            <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Reconnect
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={() => void loadStatus()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh status
          </Button>
        </div>

        {status && status.state === "CONFIGURATION_ERROR" && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <CardContent className="pt-6">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                The Microsoft 365 integration is not configured. Ask an administrator to set the
                Microsoft Entra ID environment variables (AUTH_MICROSOFT_ENTRA_ID_ID,
                AUTH_MICROSOFT_ENTRA_ID_SECRET, AUTH_MICROSOFT_ENTRA_ID_TENANT_ID, AUTH_SECRET) and
                restart the app.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
