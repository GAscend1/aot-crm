import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-10">
      <h1 className="text-4xl font-bold">
        Welcome, {session.user?.name}
      </h1>

      <p className="mt-2 text-slate-400">
        {session.user?.email}
      </p>

      <div className="mt-8 rounded-xl border border-slate-700 p-6">
        <h2 className="text-2xl font-semibold">
          AOT CRM Dashboard
        </h2>

        <p className="mt-4">
          🎉 Microsoft Entra ID authentication is working successfully.
        </p>
      </div>
    </main>
  );
}