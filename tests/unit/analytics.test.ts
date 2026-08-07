import { describe, it, expect } from "vitest";

import {
  averageCycleDays,
  breakdownByReason,
  buildForecastSeries,
  buildTeamProductivity,
  buildWinRateTrend,
  computeVelocity,
} from "@/lib/analytics";

describe("buildForecastSeries", () => {
  const now = new Date(2026, 5, 15); // June 2026

  it("buckets deals by expected close month", () => {
    const series = buildForecastSeries(
      [
        { value: 1000, probability: 100, expectedCloseDate: new Date(2026, 5, 10) },
        { value: 2000, probability: 50, expectedCloseDate: new Date(2026, 6, 5) },
        { value: 4000, probability: 25, expectedCloseDate: new Date(2026, 5, 20) },
      ],
      3,
      now,
    );

    expect(series.months).toHaveLength(3);
    expect(series.months[0].month).toBe("Jun");
    // June: committed (1000 at 100%) + weighted (1000 + 4000*0.25) + best (1000+4000)
    expect(series.months[0].committed).toBe(1000);
    expect(series.months[0].weighted).toBeCloseTo(2000);
    expect(series.months[0].best).toBe(5000);
    // July: 2000 at 50% → weighted 1000, not committed, best 2000
    expect(series.months[1].weighted).toBeCloseTo(1000);
    expect(series.months[1].committed).toBe(0);
    expect(series.months[1].best).toBe(2000);
    // Totals
    expect(series.totals.committed).toBe(1000);
    expect(series.totals.weighted).toBeCloseTo(3000);
    expect(series.totals.best).toBe(7000);
  });

  it("drops deals outside the forecast window", () => {
    const series = buildForecastSeries(
      [
        { value: 500, probability: 50, expectedCloseDate: new Date(2026, 8, 1) }, // Sep, outside 3 months
        { value: 250, probability: 90, expectedCloseDate: new Date(2026, 5, 25) },
      ],
      3,
      now,
    );
    expect(series.totals.best).toBe(250);
    expect(series.totals.committed).toBe(250);
  });

  it("treats 80%+ probability as committed", () => {
    const series = buildForecastSeries(
      [{ value: 1000, probability: 79, expectedCloseDate: new Date(2026, 5, 30) }],
      1,
      now,
    );
    expect(series.totals.committed).toBe(0);
    expect(series.totals.weighted).toBeCloseTo(790);
  });
});

describe("averageCycleDays", () => {
  it("computes the mean of valid cycles", () => {
    const days = averageCycleDays([
      { createdAt: new Date(2026, 0, 1), closedAt: new Date(2026, 0, 31) }, // 30
      { createdAt: new Date(2026, 1, 1), closedAt: new Date(2026, 1, 21) }, // 20
    ]);
    expect(days).toBe(25);
  });

  it("ignores deals without closedAt and returns 0 when none", () => {
    expect(averageCycleDays([{ createdAt: new Date(2026, 0, 1) }])).toBe(0);
  });

  it("ignores inverted cycles", () => {
    const days = averageCycleDays([
      { createdAt: new Date(2026, 1, 10), closedAt: new Date(2026, 1, 1) }, // negative → skipped
      { createdAt: new Date(2026, 0, 1), closedAt: new Date(2026, 0, 11) }, // 10
    ]);
    expect(days).toBe(10);
  });
});

describe("computeVelocity", () => {
  it("divides weighted pipeline by cycle days", () => {
    expect(computeVelocity(100000, 50)).toBe(2000);
  });
  it("returns 0 when cycle is unknown", () => {
    expect(computeVelocity(100000, 0)).toBe(0);
  });
});

describe("buildWinRateTrend", () => {
  const from = new Date(2026, 0, 1);
  const to = new Date(2026, 2, 1);

  it("buckets won/lost by month and computes rate", () => {
    const trend = buildWinRateTrend(
      [
        { isWon: true, closedAt: new Date(2026, 0, 15), createdAt: new Date(2025, 11, 1) },
        { isWon: false, closedAt: new Date(2026, 0, 20), createdAt: new Date(2025, 11, 1) },
        { isWon: true, closedAt: new Date(2026, 1, 10), createdAt: new Date(2026, 0, 1) },
      ],
      from,
      to,
    );

    expect(trend).toHaveLength(3);
    expect(trend[0]).toMatchObject({ month: "Jan", won: 1, lost: 1, winRate: 50 });
    expect(trend[1]).toMatchObject({ month: "Feb", won: 1, lost: 0, winRate: 100 });
    expect(trend[2]).toMatchObject({ month: "Mar", won: 0, lost: 0, winRate: 0 });
  });

  it("falls back to createdAt when closedAt is missing", () => {
    const trend = buildWinRateTrend(
      [{ isWon: true, createdAt: new Date(2026, 1, 5) }],
      from,
      to,
    );
    expect(trend[1].won).toBe(1);
  });
});

describe("breakdownByReason", () => {
  it("groups by reason and falls back for missing reasons", () => {
    const rows = breakdownByReason(
      [
        { value: 100, reason: "Budget" },
        { value: 200, reason: "Budget" },
        { value: 50, reason: "" },
      ],
      "No reason recorded",
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ name: "Budget", value: 300, count: 2 });
    expect(rows[1]).toMatchObject({ name: "No reason recorded", value: 50, count: 1 });
  });
});

describe("buildTeamProductivity", () => {
  const deals = [
    { owner: { name: "Alice" }, value: 5000, isWon: true, isClosed: true },
    { owner: { name: "Alice" }, value: 1000, isWon: false, isClosed: false },
    { owner: { name: "Bob" }, value: 2000, isWon: false, isClosed: true },
  ];
  const activities = [
    { assignee: { name: "Alice" }, type: "Task", status: "Completed" },
    { assignee: { name: "Alice" }, type: "Task", status: "Planned" },
    { assignee: { name: "Alice" }, type: "Meeting", status: "Completed" },
    { assignee: { name: "Bob" }, type: "Call", status: "Completed" },
    { assignee: { name: null }, type: "Email", status: "Completed" },
  ];

  it("rolls up won value, counts, and activity mix per owner", () => {
    const result = buildTeamProductivity(deals, activities);
    const alice = result.find((r) => r.name === "Alice");
    const bob = result.find((r) => r.name === "Bob");
    const unassigned = result.find((r) => r.name === "Unassigned");

    expect(alice).toMatchObject({
      wonValue: 5000,
      wonCount: 1,
      activeDeals: 1,
      winRate: 100,
      tasksCompleted: 1,
      meetingsHeld: 1,
      callsMade: 0,
    });
    expect(bob).toMatchObject({ wonCount: 0, activeDeals: 0, winRate: 0, callsMade: 1 });
    // Alice is the only winner → overall win rate 50% is her rate too (already 100 via her own closed deals)
    expect(unassigned?.emailsSent).toBe(1);
  });

  it("sorts by won value descending", () => {
    const result = buildTeamProductivity(deals, activities);
    expect(result[0].name).toBe("Alice");
  });
});
