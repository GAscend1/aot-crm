import Image from "next/image";

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 px-6">

      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-white/10 p-10 shadow-2xl backdrop-blur-xl">

        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/logo.png"
            alt="AOT Logo"
            width={90}
            height={90}
            priority
          />
        </div>

        <h1 className="mt-6 text-center text-5xl font-bold tracking-tight text-white">
          AOT CRM
        </h1>

        <h2 className="mt-3 text-center text-xl font-semibold text-blue-200">
          Welcome to AOT CRM
        </h2>

        <p className="mt-6 text-center text-gray-300">
          Customer Relationship Management System for
          <span className="font-semibold text-white">
            {" "}Ascend One Tech
          </span>
        </p>

        <p className="mt-4 text-center text-sm leading-7 text-slate-300">
          Securely manage customers, leads, opportunities,
          activities, service requests, and reports through
          one centralized cloud platform.
        </p>

        {/* Sign In Button */}
        <button
          className="mt-10 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-blue-600 text-lg font-semibold text-white transition hover:bg-blue-700"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 23 23"
          >
            <rect width="10" height="10" fill="#F25022" />
            <rect x="12" width="10" height="10" fill="#7FBA00" />
            <rect y="12" width="10" height="10" fill="#00A4EF" />
            <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
          </svg>

          Continue with Microsoft
        </button>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-slate-400">
          Powered by Microsoft Entra ID
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-center text-xs text-slate-400">
        © 2026 Ascend One Tech. All rights reserved.
      </div>

    </main>
  );
}