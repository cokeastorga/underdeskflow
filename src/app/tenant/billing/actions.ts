"use server";

import { adminDb } from "@/lib/firebase/admin-config";
import { PlanId } from "@/types/billing";
import { revalidatePath } from "next/cache";

export async function upgradePlanAction(storeId: string, userId: string, newPlanId: PlanId) {
    if (!storeId || !userId || !newPlanId) {
        throw new Error("Missing required fields for upgrade");
    }

    try {
        await adminDb.runTransaction(async (transaction) => {
            const storeRef = adminDb.collection("stores").doc(storeId);
            const userRef = adminDb.collection("users").doc(userId);
            const subRef = adminDb.collection("subscriptions").doc(storeId);

            // 1. Update Store
            transaction.update(storeRef, {
                planId: newPlanId,
                subscriptionStatus: "active",
                updatedAt: Date.now()
            });

            // 2. Update Subscription document (centralized billing)
            transaction.set(subRef, {
                planId: newPlanId,
                status: "active",
                updatedAt: Date.now(),
                currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
                cancelAtPeriodEnd: false
            }, { merge: true });

            // 3. Log the upgrade event
            const logRef = adminDb.collection("audit_logs").doc();
            transaction.set(logRef, {
                userId,
                storeId,
                action: "PLAN_UPGRADE",
                details: { newPlanId },
                timestamp: Date.now()
            });
        });

        revalidatePath("/tenant/billing");
        return { success: true };
    } catch (error: any) {
        console.error("Plan upgrade transaction failed:", error);
        throw new Error("No se pudo procesar la actualización del plan.");
    }
}
