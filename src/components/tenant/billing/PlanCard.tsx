"use client";

import { PLANS, formatPlanPrice } from "@/lib/billing/plans";
import { Plan, PlanId } from "@/types/billing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanCardProps {
    plan: Plan;
    currentPlan: PlanId;
    storeCount: number;
    onUpgrade: (plan: Plan) => void;
}

export function PlanCard({ plan, currentPlan, storeCount, onUpgrade }: PlanCardProps) {
    const isCurrent = plan.id === currentPlan;
    const isDowngrade = PLANS.findIndex(p => p.id === plan.id) < PLANS.findIndex(p => p.id === currentPlan);

    const colorMap: Record<string, { border: string; badge: string; btn: string }> = {
        zinc: { border: "border-zinc-200 dark:border-zinc-700", badge: "bg-zinc-100 text-zinc-700", btn: "variant-outline" },
        blue: { border: "border-blue-400 shadow-blue-100 dark:shadow-blue-950/30 shadow-lg", badge: "bg-blue-600 text-white", btn: "bg-blue-600 hover:bg-blue-700 text-white" },
        violet: { border: "border-violet-400", badge: "bg-violet-600 text-white", btn: "bg-violet-600 hover:bg-violet-700 text-white" },
    };
    const colors = colorMap[plan.color] ?? colorMap.zinc;

    return (
        <div className={cn(
            "relative rounded-2xl border-2 p-6 flex flex-col gap-4 bg-white dark:bg-zinc-900 transition-all duration-300",
            colors.border,
            plan.highlight && "scale-[1.02]"
        )}>
            {plan.badge && (
                <span className={cn("absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full", colors.badge)}>
                    {plan.badge}
                </span>
            )}

            <div>
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
            </div>

            <div className="flex items-end gap-1">
                <span className="text-3xl font-extrabold">{formatPlanPrice(plan.priceMonthly)}</span>
            </div>

            {/* Usage bar (only on current plan) */}
            {isCurrent && (
                <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Tiendas usadas</span>
                        <span className="font-medium">{storeCount} / {plan.maxStores}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full rounded-full bg-primary transition-all duration-700"
                            style={{ width: `${Math.min((storeCount / plan.maxStores) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Features */}
            <ul className="space-y-2 flex-1">
                {plan.features.map(f => (
                    <li key={f.label} className={cn("flex items-center gap-2 text-sm", !f.included && "opacity-45")}>
                        {f.included
                            ? <Check className="h-4 w-4 text-green-500 shrink-0" />
                            : <X className="h-4 w-4 text-muted-foreground shrink-0" />
                        }
                        {f.label}
                    </li>
                ))}
            </ul>

            {/* CTA */}
            <Button
                disabled={isCurrent || isDowngrade}
                onClick={() => onUpgrade(plan)}
                className={cn("w-full mt-2", !isCurrent && !isDowngrade && colors.btn)}
                variant={isCurrent || isDowngrade ? "outline" : "default"}
            >
                {isCurrent ? "Plan Actual" : isDowngrade ? "Plan inferior" : `Actualizar a ${plan.name}`}
            </Button>
        </div>
    );
}
