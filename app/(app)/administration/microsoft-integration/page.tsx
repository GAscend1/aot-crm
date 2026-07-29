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

type CapabilityState = "loading" | "ok" | "error" | "unknown";

interface CapabilityResult {
  name: string;
  icon: React.ElementType;
  state: CapabilityState;
  detail: string;
}

type ProviderMode = "live" | "mock" | "disconnected" | "loading";

export default function MicrosoftIntegrationPage() {
  const { data: session } = useSession();
  const [testing, setTesting] = useState(false);
  const [providerMode, setProviderMode] = useState<ProviderMode>("loading");
  const [capabilities, setCapabilities] = useState<CapabilityResult[]>([
    { name: "Profile", icon: User, state: "unknown", detail: "" },
    { name: "Photo", icon: Camera, state: "unknown", detail: "" },
    { name: "Presence", icon: Radio, state: "unknown", detail: "" },
    { name: "Mail Send", icon: Mail, state: "unknown", detail: "" },
    { name: "Mailbox", icon: Mail, state: "unknown", detail: "" },
    { name: "Calendar", icon: Calendar, state: "unknown", detail: "" },
    { name: "Teams Meeting", icon: Video, state: "unknown", detail: "" },
  ]);

  useEffect(() => {
    async function loadProvider() {
      if (!session?.user) {
        setProviderMode("disconnected");
        return;
      }
      try {
        const res = await fetch("/api/integrations/microsoft/status");
        if (!res.ok) throw new Error("Status unavailable");
        const data = await res.json() as { provider: "live" | "mock"; enabled: boolean };
        setProviderMode(data.enabled ? "live" : "mock");
      } catch {
        setProviderMode("disconnected");
      }
    }
    loadProvider();
  }, [session]);

  const runTest = useCallback(async (index: number, fetcher: () => Promise<unknown>) => {
    setCapabilities((prev) => prev.map((c, i) => i === index ? { ...c, state: "loading" as const, detail: "Testing..." } : c));
    try {
      await fetcher();
      setCapabilities((prev) => prev.map((c, i) => i === index ? { ...c, state: "ok" as const, detail: `Connected` } : c));
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

  return (
    <PageLayout
      title="Microsoft 365 Integration Status"
      description="View the current status of your Microsoft 365 integration and test connectivity."
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Provider Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 pb-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                providerMode === "live" ? "bg-green-100 text-green-600 dark:bg-green-900/30" :
                providerMode === "mock" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30" :
                "bg-red-100 text-red-600 dark:bg-red-900/30"
              }`}>
                <Wifi className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {providerMode === "live" ? "Live Mode" :
                   providerMode === "mock" ? "Mock Mode" :
                   providerMode === "loading" ? "Checking..." :
                   "Disconnected"}
                </p>
                <p className="text-xs text-slate-500">
                  {providerMode === "live" ? "Connected to Microsoft Graph" :
                   providerMode === "mock" ? "Using local mock data. Set USE_MICROSOFT_GRAPH=true for live mode." :
                   providerMode === "loading" ? "Loading provider status..." :
                   "Sign in with Microsoft Entra ID to connect."}
                </p>
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
          <Button onClick={testAll} disabled={testing || providerMode !== "live"}>
            {testing ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...</>
            ) : (
              <><RefreshCw className="mr-2 h-4 w-4" /> Test Connection</>
            )}
          </Button>

          {providerMode === "live" && (
            <Button variant="outline" onClick={() => signOut()}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Reconnect
            </Button>
          )}
        </div>

        {providerMode !== "live" && providerMode !== "loading" && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <CardContent className="pt-6">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {providerMode === "mock"
                  ? "Mock Mode is active. No Microsoft services are being called. Set USE_MICROSOFT_GRAPH=true to enable live Microsoft 365 integration."
                  : "Not signed in. Sign in with Microsoft Entra ID to connect to Microsoft 365."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
