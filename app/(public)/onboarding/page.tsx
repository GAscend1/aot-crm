"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, SkipForward, LogIn, CheckCircle,
  Building2, User, Users, Briefcase, Target, GitBranch,
  MessageSquare, Puzzle, Palette, LayoutDashboard, Bell, Sparkles
} from "lucide-react";

const STORAGE_KEY = "aot-onboarding";

interface OnboardingData {
  step: number;
  companyName: string;
  website: string;
  companySize: string;
  role: string;
  teamSize: string;
  industry: string;
  goals: string[];
  pipelineTemplate: string;
  channels: string[];
  integrationPreferences: string[];
  theme: string;
  density: string;
  dashboardWidgets: string[];
  emailNotifications: boolean;
  inAppNotifications: boolean;
  digestFrequency: string;
  completed: boolean;
}

const defaultData: OnboardingData = {
  step: 1, companyName: "", website: "", companySize: "", role: "", teamSize: "",
  industry: "", goals: [], pipelineTemplate: "", channels: [], integrationPreferences: [],
  theme: "system", density: "comfortable", dashboardWidgets: [],
  emailNotifications: true, inAppNotifications: true, digestFrequency: "daily",
  completed: false,
};

const companySizes = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
const roles = ["Sales", "Marketing", "Customer Success", "Operations", "IT", "Executive", "Other"];
const teamSizes = ["1-5", "6-10", "11-25", "26-50", "50+"];
const industries = ["Technology", "Healthcare", "Finance", "Real Estate", "Education", "Manufacturing", "Retail", "Professional Services", "Nonprofit", "Other"];
const goalOptions = ["Increase lead conversion", "Improve customer retention", "Automate sales workflows", "Centralize customer data", "Improve team collaboration", "Track sales performance", "Integrate with Microsoft 365"];
const pipelineOptions = ["Sales Pipeline (B2B)", "Sales Pipeline (B2C)", "Recruitment Pipeline", "Project Pipeline", "Start Blank"];
const channelOptions = ["Email", "Phone", "Live Chat", "Social Media", "SMS", "In-person"];
const integrationOptions = ["Microsoft 365 (Outlook, Teams, Calendar)", "Zoom", "Slack", "HubSpot", "Salesforce", "Mailchimp"];
const widgetOptions = ["Active Leads", "Pipeline Value", "Recent Activities", "Upcoming Meetings", "Team Performance", "Revenue Forecast", "Task List", "Recent Emails"];
const digestOptions = ["Real-time", "Daily", "Weekly", "Never"];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

const stepIcons = [
  Sparkles, Building2, User, Users, Briefcase, Target,
  GitBranch, MessageSquare, Puzzle, Palette, LayoutDashboard, Bell, CheckCircle,
];

export default function OnboardingPage() {
  const router = useRouter();
  const { status } = useSession();
  const [data, setData] = useState<OnboardingData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as OnboardingData;
        if (parsed.completed) {
          return parsed;
        }
        return parsed;
      }
    } catch { /* ignore */ }
    return defaultData;
  });
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    if (data.completed) {
      router.replace("/dashboard");
    }
  }, [data.completed, router]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const update = useCallback((partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const setField = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    update({ [key]: value });
  };

  const goToStep = useCallback((step: number) => {
    setDirection(step > data.step ? 1 : -1);
    update({ step: Math.max(1, Math.min(13, step)) });
  }, [data.step, update]);

  const nextStep = useCallback(() => goToStep(data.step + 1), [data.step, goToStep]);
  const prevStep = useCallback(() => goToStep(data.step - 1), [data.step, goToStep]);

  const skip = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    router.replace("/dashboard");
  }, [router]);

  const finish = useCallback(() => {
    update({ completed: true });
    localStorage.removeItem(STORAGE_KEY);
    router.replace("/dashboard");
  }, [router, update]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  const totalSteps = 13;
  const currentStep = data.step;

  const input = (label: string, key: keyof OnboardingData, placeholder = "") => (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <Input
        value={(data[key] as string) || ""}
        onChange={(e) => setField(key, e.target.value as OnboardingData[typeof key])}
        placeholder={placeholder}
        className="mt-1"
      />
    </div>
  );

  const select = (label: string, key: keyof OnboardingData, options: string[]) => (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setField(key, o as OnboardingData[typeof key])}
            className={cn(
              "rounded-lg border px-3 py-2 text-sm text-left transition-colors",
              (data[key] as string) === o
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "border-border hover:bg-muted"
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );

  const multiSelect = (label: string, key: keyof OnboardingData, options: string[]) => {
    const selected = (data[key] as string[]) || [];
    const toggle = (o: string) => {
      const next = selected.includes(o)
        ? selected.filter((s) => s !== o)
        : [...selected, o];
      setField(key, next as OnboardingData[typeof key]);
    };
    return (
      <div>
        <label className="text-sm font-medium">{label}</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm text-left transition-colors flex items-center gap-2",
                selected.includes(o)
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "border-border hover:bg-muted"
              )}
            >
              <CheckCircle className={cn("h-4 w-4", selected.includes(o) ? "opacity-100" : "opacity-0")} />
              {o}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderStep = () => {
    const Icon = stepIcons[currentStep - 1] || Sparkles;

    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Icon className="h-8 w-8 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Welcome to AOT CRM</h2>
              <p className="mt-2 text-muted-foreground">
                Let us set up your workspace in just a few steps. You can skip any step
                and configure it later from Settings.
              </p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Company information</h2>
            <p className="text-sm text-muted-foreground">Tell us about your organization.</p>
            {input("Company name", "companyName", "Acme Inc.")}
            {input("Website", "website", "acme.com")}
            {select("Company size", "companySize", companySizes)}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Your role</h2>
            <p className="text-sm text-muted-foreground">What is your primary role?</p>
            {select("Role", "role", roles)}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Team size</h2>
            <p className="text-sm text-muted-foreground">How many users will need CRM access?</p>
            {select("Team size", "teamSize", teamSizes)}
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Industry</h2>
            <p className="text-sm text-muted-foreground">Which industry does your company operate in?</p>
            {select("Industry", "industry", industries)}
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">CRM goals</h2>
            <p className="text-sm text-muted-foreground">What are your top priorities?</p>
            {multiSelect("Goals (select all that apply)", "goals", goalOptions)}
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Pipeline template</h2>
            <p className="text-sm text-muted-foreground">Choose a starting pipeline or build from scratch.</p>
            {select("Pipeline", "pipelineTemplate", pipelineOptions)}
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Communication channels</h2>
            <p className="text-sm text-muted-foreground">Which channels do you use to engage customers?</p>
            {multiSelect("Channels", "channels", channelOptions)}
          </div>
        );
      case 9:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Integration preferences</h2>
            <p className="text-sm text-muted-foreground">Connect the tools your team already uses.</p>
            {multiSelect("Integrations", "integrationPreferences", integrationOptions)}
          </div>
        );
      case 10:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Theme &amp; interface density</h2>
            <p className="text-sm text-muted-foreground">Customize your visual experience.</p>
            {select("Theme", "theme", ["light", "dark", "system"])}
            {select("Density", "density", ["compact", "comfortable"])}
          </div>
        );
      case 11:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Dashboard widgets</h2>
            <p className="text-sm text-muted-foreground">Choose what to display on your home dashboard.</p>
            {multiSelect("Widgets", "dashboardWidgets", widgetOptions)}
          </div>
        );
      case 12:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Notification preferences</h2>
            <p className="text-sm text-muted-foreground">How would you like to stay updated?</p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={data.emailNotifications}
                  onCheckedChange={(v) => update({ emailNotifications: !!v })}
                />
                <span className="text-sm">Email notifications</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={data.inAppNotifications}
                  onCheckedChange={(v) => update({ inAppNotifications: !!v })}
                />
                <span className="text-sm">In-app notifications</span>
              </label>
              {select("Digest frequency", "digestFrequency", digestOptions)}
            </div>
          </div>
        );
      case 13:
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">You are all set!</h2>
              <p className="mt-2 text-muted-foreground">
                Your workspace is configured and ready to go. Here is a summary of your choices.
              </p>
            </div>
            <Card className="text-left">
              <CardContent className="pt-6 space-y-2 text-sm">
                <p><strong>Company:</strong> {data.companyName || "Not set"}</p>
                <p><strong>Role:</strong> {data.role || "Not set"}</p>
                <p><strong>Team size:</strong> {data.teamSize || "Not set"}</p>
                <p><strong>Industry:</strong> {data.industry || "Not set"}</p>
                <p><strong>Goals:</strong> {data.goals.length ? data.goals.join(", ") : "None selected"}</p>
                <p><strong>Pipeline:</strong> {data.pipelineTemplate || "Not set"}</p>
                <p><strong>Integrations:</strong> {data.integrationPreferences.length ? data.integrationPreferences.join(", ") : "None selected"}</p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 p-4">
      <Card className="relative w-full max-w-2xl border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">
              Step {currentStep} of {totalSteps}
            </span>
            <button
              onClick={skip}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <SkipForward className="h-3 w-3" />
              Skip
            </button>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i + 1 <= currentStep ? "bg-blue-500" : "bg-white/10"
                )}
              />
            ))}
          </div>
        </div>

        <div className="min-h-[320px] flex items-center">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="w-full"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="text-slate-400 hover:text-white"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={nextStep}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={finish}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <LogIn className="mr-1 h-4 w-4" />
              Go to Dashboard
            </Button>
          )}
        </div>
      </Card>
    </main>
  );
}
