/**
 * Feature Flag Service (server-side)
 *
 * Evaluates feature flags based on a store's active subscription plan.
 * All multicanal / Enterprise-only features must be gated through this service.
 *
 * Usage (Server Component / API route):
 *   const canSync = await isFeatureEnabled('ENTERPRISE_CHANNEL_SYNC', storeId);
 */

import { adminDb } from "@/lib/firebase/admin-config";
import { PlanId } from "@/types/billing";
import { PLAN_FEATURES } from "@/lib/billing/plans";

// ─── Flag Registry ──────────────────────────────────────────────────────────

export type FeatureFlag =
    | "ENTERPRISE_CHANNEL_SYNC"   // Connect & sync external channels (Shopify, ML, etc.)
    | "MULTI_LOCATION"            // Multiple inventory locations / sucursales
    | "ADVANCED_ANALYTICS"        // Advanced analytics & reporting
    | "MULTI_USER"                // Multiple team members with RBAC
    | "WHITE_LABEL";              // Custom domain + white-label branding

/** Which plans have access to each flag */
const FLAG_PLAN_MAP: Record<FeatureFlag, PlanId[]> = {
    ENTERPRISE_CHANNEL_SYNC: ["enterprise"],
    MULTI_LOCATION: ["intermedio", "enterprise"],
    ADVANCED_ANALYTICS: ["intermedio", "enterprise"],
    MULTI_USER: ["enterprise"],
    WHITE_LABEL: ["enterprise"],
};

// ─── Server-side API ─────────────────────────────────────────────────────────

/**
 * Returns true if the given feature flag is enabled for the store's current plan.
 * Reads store document from Firestore. Safe to call in Server Components and API routes.
 */
export async function isFeatureEnabled(
    flag: FeatureFlag,
    storeId: string
): Promise<boolean> {
    try {
        const storeSnap = await adminDb.collection("stores").doc(storeId).get();
        if (!storeSnap.exists) return false;
        const plan = (storeSnap.data()?.plan ?? "basic") as PlanId;
        return isPlanAllowed(flag, plan);
    } catch {
        // Fail closed: if we can't verify, deny
        return false;
    }
}

/**
 * Synchronous check against a known plan id (no DB call).
 * Use when you already have the plan id in memory.
 */
export function isPlanAllowed(flag: FeatureFlag, plan: PlanId): boolean {
    return FLAG_PLAN_MAP[flag]?.includes(plan) ?? false;
}

/**
 * Returns all flags enabled for a given plan id.
 */
export function getEnabledFlags(plan: PlanId): FeatureFlag[] {
    return (Object.keys(FLAG_PLAN_MAP) as FeatureFlag[]).filter(flag =>
        FLAG_PLAN_MAP[flag].includes(plan)
    );
}

// Re-export for convenience
export { PLAN_FEATURES };
