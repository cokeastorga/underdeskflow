"use client";

import { getPlanById } from "@/lib/billing/plans";
import { PlanId } from "@/types/billing";
import Link from "next/link";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface CurrentPlanBannerProps {
    plan: PlanId | undefined;
    storeCount: number;
}

export function CurrentPlanBanner({ plan, storeCount }: CurrentPlanBannerProps) {
    const p = getPlanById(plan);
    const usagePercent = Math.min((storeCount / p.maxStores) * 100, 100);
    const isNearLimit = usagePercent >= 80;

    return (
        <div className={cn(
            "flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm",
            isNearLimit
                ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20"
                : "border-border bg-muted/30"
        )}>
            <Zap className={cn("h-4 w-4 shrink-0", isNearLimit ? "text-amber-500" : "text-muted-foreground")} />
            <div className="flex-1 min-w-0">
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground mx-1.5">·</span>
                <span className={cn(isNearLimit ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
                    {storeCount}/{p.maxStores} tienda{p.maxStores > 1 ? "s" : ""}
                </span>
                <div className="mt-1 h-1 w-full max-w-[120px] rounded-full bg-muted overflow-hidden inline-block ml-2 align-middle">
                    <div
                        className={cn("h-full rounded-full transition-all", isNearLimit ? "bg-amber-500" : "bg-primary")}
                        style={{ width: `${usagePercent}%` }}
                    />
                </div>
            </div>
            <Link href="/tenant/billing" className="shrink-0 text-xs font-medium text-primary hover:underline">
                {isNearLimit ? "Actualizar plan →" : "Ver plan"}
            </Link>
        </div>
    );
}
