"use server";

import { adminAuth, adminDb } from "@/lib/firebase/admin-config";
import { revalidatePath } from "next/cache";

export type TeamRole = "tenant_admin" | "store_manager" | "cashier";

export async function inviteMemberAction(
    storeId: string, 
    email: string, 
    firstName: string, 
    lastName: string, 
    role: TeamRole
) {
    if (!storeId || !email || !role) {
        throw new Error("Faltan campos obligatorios");
    }

    try {
        // 1. Check if user already exists in Auth
        let userRecord;
        try {
            userRecord = await adminAuth.getUserByEmail(email);
        } catch (e: any) {
            // User doesn't exist, we'll create them
            if (e.code === 'auth/user-not-found') {
                const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
                userRecord = await adminAuth.createUser({
                    email,
                    password: tempPassword,
                    displayName: `${firstName} ${lastName}`,
                });
                
                // Flag for password change and set initial metadata
                await adminAuth.setCustomUserClaims(userRecord.uid, { 
                    requiresPasswordChange: true,
                    role: role,
                    storeId: storeId
                });
            } else {
                throw e;
            }
        }

        // 2. Create/Update user document in Firestore
        await adminDb.collection("users").doc(userRecord.uid).set({
            firstName,
            lastName,
            email,
            role,
            storeId,
            invitedAt: Date.now(),
            status: "invited",
            requiresPasswordChange: true,
            onboardingComplete: true // Team members don't do store onboarding
        }, { merge: true });

        // 3. Add to store's team collection for easy listing
        await adminDb.collection("stores").doc(storeId).collection("team").doc(userRecord.uid).set({
            userId: userRecord.uid,
            email,
            firstName,
            lastName,
            role,
            invitedAt: Date.now(),
            status: "active"
        });

        revalidatePath("/tenant/team");
        return { success: true };
    } catch (error: any) {
        console.error("Error inviting member:", error);
        throw new Error(error.message || "No se pudo enviar la invitación.");
    }
}

export async function removeMemberAction(storeId: string, userId: string) {
    try {
        await adminDb.collection("stores").doc(storeId).collection("team").doc(userId).delete();
        await adminDb.collection("users").doc(userId).update({
            storeId: null,
            status: "removed"
        });
        revalidatePath("/tenant/team");
        return { success: true };
    } catch (error: any) {
        console.error("Error removing member:", error);
        throw new Error("No se pudo eliminar al miembro del equipo.");
    }
}
