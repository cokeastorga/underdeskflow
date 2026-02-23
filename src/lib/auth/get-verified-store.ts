import { adminAuth, adminDb } from "@/lib/firebase/admin-config";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PlanId } from "@/types/billing";

export interface VerifiedStore {
    uid: string;
    email: string;
    storeId: string;
    plan: PlanId;
    storeCount: number;
}

/**
 * Server-side helper: verifies the session cookie and returns the user's
 * uid, storeId, plan, and storeCount — all read from the Admin SDK (trusted).
 *
 * Call this at the start of any API route or Server Action that modifies
 * store-owned resources. Never trust client-sent storeId values directly.
 *
 * Redirects to /login if the session is invalid or expired.
 */
export async function getVerifiedStore(): Promise<VerifiedStore> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value;

    if (!sessionCookie) redirect("/login");

    let uid: string;
    let email: string;

    try {
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        uid = decoded.uid;
        email = decoded.email ?? "";
    } catch {
        redirect("/login");
    }

    const userSnap = await adminDb.collection("users").doc(uid).get();
    if (!userSnap.exists) redirect("/login");

    const userData = userSnap.data()!;
    const storeId: string = userData.storeId ?? null;

    if (!storeId) {
        // User authenticated but hasn't created a store yet — this is valid during onboarding
        return { uid, email, storeId: "", plan: userData.plan ?? "basic", storeCount: userData.storeCount ?? 0 };
    }

    return {
        uid,
        email,
        storeId,
        plan: (userData.plan as PlanId) ?? "basic",
        storeCount: (userData.storeCount as number) ?? 1,
    };
}

/**
 * Verifies that a given document's `storeId` field belongs to the calling user.
 * Throws a 403-equivalent error if ownership check fails.
 */
export async function assertStoreOwnership(resourceStoreId: string): Promise<VerifiedStore> {
    const verified = await getVerifiedStore();
    if (verified.storeId !== resourceStoreId) {
        throw new Error("Forbidden: storeId mismatch");
    }
    return verified;
}
