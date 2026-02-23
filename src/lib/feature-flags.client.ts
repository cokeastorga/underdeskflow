"use client";

/**
 * Feature Flag Hook (client-side)
 *
 * React hook to check feature flags in Client Components.
 * Reads the plan from the store context / auth context — no extra fetches.
 *
 * Usage:
 *   const canSync = useFeatureFlag('ENTERPRISE_CHANNEL_SYNC');
 */

import { useMemo } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { isPlanAllowed, FeatureFlag } from "@/lib/feature-flags";
import type { PlanId } from "@/types/billing";

/**
 * Returns whether a feature flag is enabled for the currently authenticated user's plan.
 * @param flag - The feature flag to check
 * @param overridePlan - Optionally override the plan (useful in billing pages)
 */
export function useFeatureFlag(
    flag: FeatureFlag,
    overridePlan?: PlanId
): boolean {
    const { user } = useAuth();
    // plan is stored on the user's custom claims or the store doc
    // For now we read from the auth context's store profile
    const plan = (overridePlan ?? (user as any)?.storePlan ?? "basic") as PlanId;

    return useMemo(() => isPlanAllowed(flag, plan), [flag, plan]);
}

/**
 * Returns the current store's plan id from auth context.
 */
export function useStorePlan(): PlanId {
    const { user } = useAuth();
    return ((user as any)?.storePlan ?? "basic") as PlanId;
}
