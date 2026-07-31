"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Home, RefreshCw, ArrowRight, ExternalLink } from "lucide-react";

export default function AdminApprovalRequiredPage() {
  const { status } = useSession();
  const router = useRouter();

  const adminConsentUrl = null;

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 p-4">
      <Card className="relative w-full max-w-2xl border-white/10 bg-white/10 p-10 shadow-2xl backdrop-blur-xl">
        <CardHeader className="p-0 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
            <ShieldAlert className="h-8 w-8 text-amber-400" />
          </div>
          <CardTitle className="mt-6 text-3xl font-bold text-white">
            Administrator approval required
          </CardTitle>
        </CardHeader>

        <CardContent className="mt-8 p-0 space-y-8">
          <div className="space-y-4 text-center">
            <p className="text-slate-300 leading-relaxed">
              AOT CRM needs permission to connect Outlook, Calendar, Teams, and your
              Microsoft profile. A Microsoft Entra administrator must approve these
              permissions before live Microsoft 365 features can be used.
            </p>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-left">
              <h3 className="font-medium text-amber-300">What this means</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-amber-200/80 list-disc list-inside">
                <li>Core CRM features (leads, contacts, pipeline) are still available</li>
                <li>Microsoft 365 integration (email, calendar, Teams) will be unavailable</li>
                <li>Contact your IT administrator to grant tenant-wide consent</li>
              </ul>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {adminConsentUrl ? (
              <Button
                variant="default"
                className="h-12 gap-2 bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => window.open(adminConsentUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                Request Admin Approval
              </Button>
            ) : (
              <Button
                variant="default"
                className="h-12 gap-2 bg-blue-600 text-white hover:bg-blue-700"
                disabled
              >
                Admin Consent URL not configured
              </Button>
            )}

            <Button
              variant="outline"
              className="h-12 gap-2 border-white/20 text-white hover:bg-white/10"
              onClick={() => router.push("/login")}
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>

            <Button
              variant="ghost"
              className="h-12 gap-2 text-slate-400 hover:text-white"
              onClick={() => router.push("/")}
            >
              <Home className="h-4 w-4" />
              Return to Home
            </Button>

            <Button
              variant="secondary"
              className="h-12 gap-2"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowRight className="h-4 w-4" />
              Continue in Limited Mode
            </Button>
          </div>

          <div className="rounded-lg border border-white/10 p-4">
            <h3 className="text-sm font-medium text-slate-300">Limited Mode</h3>
            <ul className="mt-2 space-y-1 text-xs text-slate-400 list-disc list-inside">
              <li>Access all non-Microsoft CRM features</li>
              <li>Microsoft 365 features will show as unavailable</li>
              <li>No email, calendar, or Teams actions will be performed</li>
              <li>Full functionality can be enabled once admin approves</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
