"use server";

import { adminDb } from "@/lib/firebase/admin-config";
import { revalidatePath } from "next/cache";
import { verifyRole } from "@/lib/auth/role-guard";

export async function getStoreFeatures(storeId: string) {
    await verifyRole(["platform_admin"]);
    const doc = await adminDb.doc(`stores/${storeId}/config/features`).get();
    const defaultFeatures = {
        customDomain: false,
        premiumThemes: false,
        advancedAnalytics: false,
        apiAccess: false,
        whiteLabel: false,
        prioritySupport: false
    };

    if (!doc.exists) return defaultFeatures;
    return { ...defaultFeatures, ...doc.data() };
}

export async function updateStoreFeatures(storeId: string, features: any) {
    await verifyRole(["platform_admin"]);
    await adminDb.doc(`stores/${storeId}/config/features`).set(features, { merge: true });
    
    // Also update the main store document for quick checks if needed
    await adminDb.doc(`stores/${storeId}`).set({ features }, { merge: true });
    
    revalidatePath(`/superadmin/stores/${storeId}/features`);
    return { success: true };
}

export async function getStoreBasicInfo(storeId: string) {
    await verifyRole(["platform_admin"]);
    const doc = await adminDb.doc(`stores/${storeId}`).get();
    return { id: doc.id, name: doc.data()?.name || doc.id };
}
