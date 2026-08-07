"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  User, Mail, Briefcase, Building2, Phone, MapPin, Shield, Crown, RefreshCw, AlertTriangle, RotateCcw,
} from "lucide-react";
import { useToastContext } from "@/app/(app)/AppProviders";
import { PageLayout } from "@/components/common/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { graphService } from "@/services/graph.service";
import { classifyGraphError, type IntegrationStatus } from "@/services/integration-gate";
import type { UserProfile } from "@/types/common";

interface CrmProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string | null;
  department: string | null;
  team: string | null;
  status: string | null;
  createdAt: string | null;
}

function PresenceDot({ presence }: { presence?: UserProfile["presence"] }) {
  const colors: Record<string, string> = {
    Available: "bg-[color:var(--success)]",
    Busy: "bg-[color:var(--danger)]",
    DoNotDisturb: "bg-[color:var(--danger)]",
    BeRightBack: "bg-[color:var(--warning)]",
    Away: "bg-[color:var(--warning)]",
    Offline: "bg-slate-400",
  };
  return (
    <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full ring-2 ring-background ${presence ? colors[presence] || "bg-slate-400" : "hidden"}`} />
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const { success, error } = useToastContext();
  const [isDevResetBusy, setDevResetBusy] = useState(false);

  // CRM-first identity — always loads, independent of Microsoft Graph.
  const [crm, setCrm] = useState<CrmProfile | null>(null);
  const [crmLoading, setCrmLoading] = useState(true);

  // Microsoft Graph enrichment — loaded asynchronously, never blocks render.
  const [graph, setGraph] = useState<UserProfile | null>(null);
  const [graphIssue, setGraphIssue] = useState<IntegrationStatus | null>(null);
  const [graphLoading, setGraphLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/users/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!cancelled) setCrm((body?.data as CrmProfile) ?? null);
      })
      .catch(() => { /* session fallback still applies */ })
      .finally(() => {
        if (!cancelled) setCrmLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadGraph = useCallback(() => {
    let cancelled = false;
    graphService
      .getProfile()
      .then((profile) => {
        if (cancelled) return;
        setGraph(profile);
        setGraphIssue(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setGraph(null);
        setGraphIssue(classifyGraphError(err));
      })
      .finally(() => {
        if (!cancelled) setGraphLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return loadGraph();
  }, [loadGraph, attempt]);

  const retryGraph = useCallback(() => {
    setGraphLoading(true);
    setAttempt((a) => a + 1);
  }, []);

  const name = crm?.name || session?.user?.name || "User";
  const email = crm?.email || session?.user?.email || "";
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const graphNeedsAction =
    graphIssue &&
    (graphIssue.state === "SIGN_IN_REQUIRED" ||
      graphIssue.state === "RECONSENT_REQUIRED" ||
      graphIssue.state === "TOKEN_EXPIRED");

  return (
    <PageLayout title="My Profile" description="View and manage your account information.">
      <div className="grid gap-5 lg:grid-cols-3">
        {/* CRM identity — always renders */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            {crmLoading ? (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <Skeleton className="h-20 w-20 rounded-full" />
                </div>
                <Skeleton className="mx-auto h-5 w-32" />
                <Skeleton className="mx-auto h-4 w-40" />
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar size="lg">
                    <AvatarImage src={graph?.photoUrl || crm?.image || session?.user?.image || undefined} />
                    <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <PresenceDot presence={graph?.presence} />
                </div>
                <h2 className="text-xl font-bold text-foreground">{name}</h2>
                <p className="text-sm text-muted-foreground">
                  {crm?.role ? crm.role.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : "Team member"}
                </p>
                {crm?.department && <p className="mt-1 text-xs text-muted-foreground/70">{crm.department}</p>}
                {crm?.team && <p className="text-xs text-muted-foreground/70">Team: {crm.team}</p>}
              </div>
            )}

            {graph?.manager && (
              <div className="mt-6 rounded-lg bg-muted/40 p-3 text-left">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Manager</p>
                <p className="text-sm font-medium text-foreground">{graph.manager}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5 lg:col-span-2">
          {/* Microsoft 365 enrichment card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Microsoft 365 Profile
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={retryGraph} disabled={graphLoading}>
                <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${graphLoading ? "animate-spin" : ""}`} />
                {graphLoading ? "Loading..." : "Refresh"}
              </Button>
            </CardHeader>
            <CardContent>
              {graphLoading && graph === null ? (
                <div className="space-y-2">
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              ) : graph ? (
                <div className="divide-y">
                  <InfoRow icon={Mail} label="Email" value={graph.email || email} />
                  <InfoRow icon={Briefcase} label="Job Title" value={graph.jobTitle} />
                  <InfoRow icon={Building2} label="Department" value={graph.department} />
                  <InfoRow icon={Phone} label="Phone" value={graph.phone} />
                  <InfoRow icon={Phone} label="Mobile" value={graph.mobilePhone} />
                  <InfoRow icon={MapPin} label="Office Location" value={graph.officeLocation} />
                </div>
              ) : graphIssue ? (
                <div className="rounded-lg border border-warning/30 bg-warning-soft/50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--warning)]" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{graphIssue.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{graphIssue.message}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={retryGraph}>
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                          Retry
                        </Button>
                        {graphNeedsAction && (
                          <Button
                            size="sm"
                            onClick={() => window.location.assign("/api/auth/signin/microsoft-entra-id?callbackUrl=/profile")}
                          >
                            Reconnect
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No Microsoft 365 data available.</p>
              )}
            </CardContent>
          </Card>

          {/* CRM account details — always renders */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <InfoRow icon={Shield} label="Authentication Provider" value="Microsoft Entra ID" />
              <InfoRow icon={User} label="Account Type" value="Enterprise" />
              <InfoRow icon={Mail} label="Email" value={email} />
              <InfoRow icon={Shield} label="Status" value={crm?.status || "Active"} />
              <InfoRow icon={User} label="User ID" value={graph?.id || crm?.id || email} />
            </CardContent>
          </Card>

          {/* Roles — CRM workspace role and SaaS Platform access are separate
              concepts: Platform Owner is SaaS authorization (verified Entra tid),
              while the CRM role (Viewer/Admin/...) is the workspace role. They
              are shown side by side and never mutated into each other. */}
          <Card>
            <CardHeader>
              <CardTitle>Roles & Access</CardTitle>
            </CardHeader>
            <CardContent className="divide-y">
              <InfoRow
                icon={Shield}
                label="CRM Role"
                value={
                  crm?.role
                    ? crm.role.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
                    : "—"
                }
              />
              <InfoRow
                icon={Crown}
                label="Platform Access"
                value={session?.user?.isPlatformOwner ? "Platform Owner" : "Standard"}
              />
            </CardContent>
          </Card>

          {/* Development-only: first-login flow reset for the current test account.
              Hidden in production by the API (404). Never touches CRM records. */}
          {process.env.NODE_ENV !== "production" && (
            <Card className="border-warning/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[color:var(--warning)]">
                  <RotateCcw className="h-4 w-4" />
                  Developer Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Reset the first-login experience (onboarding, product tour,
                  getting-started checklist) for this account. No CRM records are
                  touched. Visible only in development.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDevResetBusy}
                  onClick={() => {
                    setDevResetBusy(true);
                    fetch("/api/dev/onboarding-reset", { method: "POST" })
                      .then(async (res) => {
                        if (!res.ok) throw new Error("Reset failed");
                        success(
                          "Onboarding reset",
                          "Sign out and sign back in to see the first-login flow again.",
                        );
                      })
                      .catch(() => error("Error", "Could not reset onboarding."))
                      .finally(() => setDevResetBusy(false));
                  }}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  {isDevResetBusy ? "Resetting…" : "Reset onboarding flow"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
