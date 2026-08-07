"use client";

import Link from "next/link";
import { Building2, Users, Briefcase, Contact } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RelationshipNode {
  id: string;
  label: string;
  sublabel?: string;
  kind: "contact" | "opportunity" | "customer";
  href: string;
}

interface RelationshipGraphProps {
  companyLabel: string;
  contacts: RelationshipNode[];
  opportunities: RelationshipNode[];
  customers: RelationshipNode[];
}

interface Pos {
  x: number;
  y: number;
}

/**
 * Compact relationship graph for the 360 view. Deterministic static layout —
 * the company sits at the center, related records fan out on three sides.
 * Falls back to a hub list when there are no relationships yet.
 */
export function RelationshipGraph({
  companyLabel,
  contacts,
  opportunities,
  customers,
}: RelationshipGraphProps) {
  const total = contacts.length + opportunities.length + customers.length;
  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
        <Building2 className="h-8 w-8" />
        <p>No relationships yet. Add contacts, customers, or opportunities to see them here.</p>
      </div>
    );
  }

  // Evenly spread a list of items around a center value (y only; callers add x).
  const spread = (n: number, center: number, gap: number): Omit<Pos, "x">[] =>
    Array.from({ length: n }, (_, i) => ({ y: center + (i - (n - 1) / 2) * gap }));

  const contactsPos = spread(contacts.length, 170, 55).map((p) => ({ ...p, x: 96 }));
  const opportunitiesPos = spread(opportunities.length, 170, 55).map((p) => ({ ...p, x: 624 }));
  const customersPos = spread(customers.length, 300, 0).map((p, i) => ({
    x: 200 + i * 160 - ((customers.length - 1) / 2) * 160,
    y: p.y,
  }));

  const hub: Pos = { x: 360, y: 168 };

  type Slot = "left" | "right" | "bottom";
  const nodes: { node: RelationshipNode; slot: Slot; pos: Pos }[] = [
    ...contacts.map((node, i) => ({ node, slot: "left" as Slot, pos: contactsPos[i] })),
    ...opportunities.map((node, i) => ({ node, slot: "right" as Slot, pos: opportunitiesPos[i] })),
    ...customers.map((node, i) => ({ node, slot: "bottom" as Slot, pos: customersPos[i] })),
  ];

  const slotMeta: Record<Slot, { icon: React.ElementType; classes: string }> = {
    left: { icon: Users, classes: "bg-info-soft text-[color:var(--info)]" },
    right: { icon: Briefcase, classes: "bg-warning-soft text-[color:var(--warning)]" },
    bottom: { icon: Contact, classes: "bg-success-soft text-[color:var(--success)]" },
  };

  return (
    <div className="overflow-x-auto rounded-xl border bg-surface-raised p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Relationship Graph</h3>
        <span className="text-[11px] text-muted-foreground">
          {contacts.length} people · {opportunities.length} deals · {customers.length} customers
        </span>
      </div>

      <div className="mt-3 flex min-w-[560px] justify-center">
        <svg viewBox="0 0 720 340" className="w-full max-w-[720px]" role="img" aria-label={`Relationships for ${companyLabel}`}>
          <defs>
            <marker id="rel-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
              <path d="M0,0 L7,3.5 L0,7 Z" fill="var(--border)" />
            </marker>
          </defs>

          {nodes.map(({ pos }, i) => (
            <line
              key={i}
              x1={hub.x}
              y1={hub.y}
              x2={pos.x}
              y2={pos.y}
              stroke="var(--border)"
              strokeWidth={1}
              markerEnd="url(#rel-arrow)"
            />
          ))}

          {/* Center hub */}
          <g>
            <circle cx={hub.x} cy={hub.y} r={56} fill="var(--primary-soft, rgba(59,130,246,0.12))" />
            <circle cx={hub.x} cy={hub.y} r={56} fill="none" stroke="var(--primary)" strokeOpacity={0.4} strokeWidth={1.5} />
            <foreignObject x={hub.x - 50} y={hub.y - 32} width={100} height={64}>
              <div className="flex h-full flex-col items-center justify-center gap-0.5 px-1 text-center">
                <Building2 className="h-4 w-4 text-[color:var(--primary)]" aria-hidden="true" />
                <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-foreground">{companyLabel}</span>
              </div>
            </foreignObject>
          </g>

          {/* Nodes */}
          {nodes.map(({ node, slot, pos }) => {
            const meta = slotMeta[slot];
            const NodeIcon = meta.icon;
            return (
              <g key={node.id}>
                <circle cx={pos.x} cy={pos.y} r={24} className="fill-popover" stroke="var(--border)" strokeWidth={1} />
                <foreignObject x={pos.x - 16} y={pos.y - 14} width={32} height={28}>
                  <Link href={node.href} className="flex h-full items-center justify-center">
                    <span className={cn("flex h-7 w-7 items-center justify-center rounded-full", meta.classes)}>
                      <NodeIcon className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </foreignObject>
                <foreignObject x={pos.x - 70} y={pos.y + 26} width={140} height={40}>
                  <div className="text-center">
                    <p className="truncate px-1 text-[11px] font-medium text-foreground">{node.label}</p>
                    {node.sublabel && <p className="truncate px-1 text-[10px] text-muted-foreground">{node.sublabel}</p>}
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
