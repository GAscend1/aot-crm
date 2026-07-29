"use client";

import { useCallback, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, ShieldAlert, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = useCallback(() => {
    setIsSigningIn(true);
    signIn("microsoft-entra-id", { callbackUrl });
  }, [callbackUrl]);

  const isAdminApprovalError = error === "admin_consent_required";
  const isAuthenticated = status === "authenticated";

  if (isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Already signed in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">You are already authenticated.</p>
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-lg border-white/10 bg-white/10 p-10 shadow-2xl backdrop-blur-xl text-center">
        <CardHeader className="p-0">
          <div className="flex justify-center">
            <img src="/Logo.png" alt="AOT Logo" width={90} height={90} />
          </div>
          <CardTitle className="mt-6 text-4xl font-bold tracking-tight text-white">
            AOT CRM
          </CardTitle>
          <p className="mt-2 text-lg font-semibold text-blue-200">
            Welcome to AOT CRM
          </p>
        </CardHeader>

        <CardContent className="mt-6 p-0 space-y-6">
          <p className="text-sm leading-7 text-slate-300">
            Securely manage customers, leads, opportunities,
            activities, service requests, and reports through
            one centralized cloud platform.
          </p>

          {isAdminApprovalError && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-left">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div>
                  <p className="font-medium text-amber-300">Administrator approval required</p>
                  <p className="mt-1 text-sm text-amber-200/80">
                    A Microsoft Entra administrator must grant consent before
                    Microsoft 365 features can be used. You may still access
                    core CRM features.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && !isAdminApprovalError && (
            <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              <p className="text-sm text-red-200">
                Authentication failed. Please try again or contact your administrator.
              </p>
            </div>
          )}

          {isAdminApprovalError ? (
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-12 gap-3 border-white/20 text-white hover:bg-white/10"
                onClick={() => window.location.href = "/auth/admin-approval-required"}
              >
                View Admin Approval Instructions
              </Button>
              <Button
                variant="ghost"
                className="w-full text-slate-400 hover:text-white"
                onClick={() => window.location.href = "/dashboard"}
              >
                Continue to Dashboard (Limited Mode)
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-blue-600 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
            >
              {isSigningIn ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg width="22" height="22" viewBox="0 0 23 23">
                  <rect width="10" height="10" fill="#F25022" />
                  <rect x="12" width="10" height="10" fill="#7FBA00" />
                  <rect y="12" width="10" height="10" fill="#00A4EF" />
                  <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
                </svg>
              )}
              {isSigningIn ? "Signing in..." : "Sign In with Microsoft"}
            </Button>
          )}

          <div className="border-t border-white/10 pt-6 text-center text-sm text-slate-400">
            Powered by Microsoft Entra ID
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </CardContent>
      </Card>

      <div className="absolute bottom-6 text-center text-xs text-slate-400">
        &copy; 2026 Ascend One Tech. All rights reserved.
      </div>
    </main>
  );
}
