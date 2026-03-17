import { adminDb } from "@/lib/firebase/admin-config";
import { Subscription, PlanId, PLANS } from "./types";

const subsCol = adminDb.collection("subscriptions");

export async function getSubscription(tenantId: string): Promise<Subscription> {
    const doc = await subsCol.doc(tenantId).get();
    
    if (!doc.exists) {
        // Default to Basic plan for new/unconfigured tenants
        return {
            id: tenantId,
            planId: "Basic",
            status: "active",
            currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
            cancelAtPeriodEnd: false,
            updatedAt: Date.now()
        };
    }

    return doc.data() as Subscription;
}

export async function updateSubscription(tenantId: string, data: Partial<Subscription>) {
    await subsCol.doc(tenantId).set({
        id: tenantId,
        ...data,
        updatedAt: Date.now()
    }, { merge: true });
}

export async function getPlanFeatures(tenantId: string) {
    const sub = await getSubscription(tenantId);
    return PLANS[sub.planId].features;
}

export async function getAllSubscriptions() {
    const snap = await subsCol.get();
    return snap.docs.map(doc => doc.data() as Subscription);
}
