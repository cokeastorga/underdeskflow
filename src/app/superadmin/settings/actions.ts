"use server";

import { adminDb } from "@/lib/firebase/admin-config";
import { revalidatePath } from "next/cache";

export async function getSystemConfig() {
    const doc = await adminDb.collection("system").doc("config").get();
    if (!doc.exists) {
        return {
            maintenanceMode: false,
            registrationEnabled: true,
            platformFee: 8.0,
            payoutIntervalDays: 7
        };
    }
    return doc.data();
}

export async function updateSystemConfig(data: any) {
    await adminDb.collection("system").doc("config").set(data, { merge: true });
    revalidatePath("/superadmin/settings");
    return { success: true };
}
