"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  Home,
  RefreshCw,
  ShieldAlert,
  Wrench,
  Lock,
} from "lucide-react";

/**
 * Shared auth error page (Auth.js `pages.error`). Reads the real error code
 * from the URL and renders an accurate, user-safe message instead of the old
 * hard-coded "administrator approval required" screen.
 */
function AuthErrorForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") ?? "Default";

  const isConsent = /consent|AccessDenied/i.test(error);
  const isConfiguration = /configuration|config/i.test(error);
  const isCredential = /credential|OAuth/i.test(error);

  const meta = isConsent
    ? {
        icon: ShieldAlert,
        title: "Consent required",
        message:
          "Microsoft 365 needs your consent again. Sign in to reconnect — core CRM features keep working either way.",
      }
    : isConfiguration
      ? {
          icon: Wrench,
          title: "Configuration error",
          message:
            "The Microsoft Entra ID integration is not fully configured. Contact your administrator.",
        }
      : isCredential
        ? {
            icon: Lock,
            title: "Sign-in issue",
            message: "The sign-in could not be completed. Try again or contact your administrator.",
          }
        : {
            icon: AlertTriangle,
            title: "Authentication failed",
            message: "Something went wrong while signing in. Please try again.",
          };

  const Icon = meta.icon;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 p-4">
      <Card className="relative w-full max-w-lg border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
        <CardHeader className="p-0 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20">
            <Icon className="h-7 w-7 text-amber-400" />
          </div>
          <CardTitle className="mt-5 text-2xl font-bold text-white">{meta.title}</CardTitle>
        </CardHeader>

        <CardContent className="mt-5 space-y-4 p-0">
          <p className="text-center text-sm leading-relaxed text-slate-300">{meta.message}</p>

          <div className="flex flex-col gap-2.5">
            <Button
              onClick={() => void signIn("microsoft-entra-id", { callbackUrl: "/dashboard" })}
              className="h-11 w-full gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Sign in again
            </Button>
            <Button asChild variant="outline" className="h-11 w-full gap-2 border-white/20 text-white hover:bg-white/10">
              <Link href="/login">
                <Home className="h-4 w-4" />
                Back to login
              </Link>
            </Button>
            <Button asChild variant="ghost" className="h-11 w-full gap-2 text-slate-400 hover:text-white">
              <Link href="/dashboard">Continue in Limited Mode</Link>
            </Button>
          </div>

          <div className="rounded-lg border border-white/10 p-3.5">
            <p className="text-xs leading-relaxed text-slate-400">
              Core CRM features (leads, contacts, pipeline, tickets, reports) never require
              Microsoft 365. Only email, calendar, and Teams features depend on the connection.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorForm />
    </Suspense>
  );
}
