import { kpis } from "../mockData";

export function DashboardKPIs() {
  return (
    <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-5">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isPositive = kpi.change >= 0;

        return (
          <div
            key={kpi.title}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{kpi.title}</p>
                <h2 className="mt-2 text-3xl font-bold">{kpi.value}</h2>
              </div>
              <div className="rounded-lg bg-slate-100 p-3">
                <Icon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm">
              <span
                className={`font-medium ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPositive ? "+" : ""}
                {kpi.change}%
              </span>
              <span className="text-slate-400">vs last month</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
