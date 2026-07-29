"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Briefcase, Building2, Phone, MapPin, ChevronRight, Shield } from "lucide-react";
import { PageLayout } from "@/components/common/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { graphService } from "@/services/graph.service";
import type { UserProfile } from "@/types/common";

function PresenceDot({ presence }: { presence: UserProfile["presence"] }) {
  const colors: Record<string, string> = {
    Available: "bg-green-500",
    Busy: "bg-red-500",
    DoNotDisturb: "bg-red-500",
    BeRightBack: "bg-amber-500",
    Away: "bg-amber-500",
    Offline: "bg-slate-400",
  };
  return (
    <span className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${colors[presence] || "bg-slate-400"}`} />
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{value || "-"}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [manager, setManager] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [prof, mgr] = await Promise.all([
        graphService.getProfile(),
        graphService.getManager(),
      ]);
      setProfile(prof);
      setManager(mgr);
      setLoading(false);
    }
    load();
  }, []);

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  if (loading) {
    return (
      <PageLayout title="My Profile" description="View and manage your account information.">
        <div className="space-y-5">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="My Profile" description="View and manage your account information.">
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Avatar size="lg">
                  <AvatarImage src={profile?.photoUrl || session?.user?.image || undefined} />
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <PresenceDot presence={profile?.presence || "Offline"} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {profile?.displayName || session?.user?.name || "User"}
              </h2>
              <p className="text-sm text-slate-500">{profile?.jobTitle || "No title"}</p>
              <p className="text-xs text-slate-400 mt-1">{profile?.department || ""}</p>

              <div className="mt-6 flex w-full flex-col gap-1">
                {manager && (
                  <div className="rounded-lg bg-slate-50 p-3 text-left dark:bg-slate-800">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Manager</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{manager.name}</p>
                    <p className="text-xs text-slate-500">{manager.email}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="divide-y dark:divide-slate-800">
              <InfoRow icon={Mail} label="Email" value={profile?.email || session?.user?.email || ""} />
              <InfoRow icon={Briefcase} label="Job Title" value={profile?.jobTitle || ""} />
              <InfoRow icon={Building2} label="Department" value={profile?.department || ""} />
              <InfoRow icon={Phone} label="Phone" value={profile?.phone || ""} />
              <InfoRow icon={Phone} label="Mobile" value={profile?.mobilePhone || ""} />
              <InfoRow icon={MapPin} label="Office Location" value={profile?.officeLocation || ""} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="divide-y dark:divide-slate-800">
              <InfoRow icon={Shield} label="Authentication Provider" value="Microsoft Entra ID" />
              <InfoRow icon={User} label="Account Type" value="Enterprise" />
              <InfoRow icon={ChevronRight} label="User ID" value={profile?.id || session?.user?.email || ""} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
