import { getVerifiedStore } from "@/lib/auth/get-verified-store";
import { adminDb } from "@/lib/firebase/admin-config";
import { ForbiddenError, UnauthorizedError } from "@/lib/utils/errors";

export type AllowedRole = "platform_admin" | "tenant_admin" | "store_manager" | "cashier";

/**
 * Server-side security guard for API routes and Server Actions.
 * Verifies that the user has one of the allowed roles.
 */
export async function verifyRole(allowedRoles: AllowedRole[]) {
    const verified = await getVerifiedStore();
    
    // 1. Fetch user role from Firestore (source of truth)
    const userSnap = await adminDb.collection("users").doc(verified.uid).get();
    if (!userSnap.exists) throw new UnauthorizedError();
    
    const userRole = userSnap.data()?.role as AllowedRole;
    
    // 2. Platform admins bypass all role checks
    if (userRole === "platform_admin") return verified;

    // 3. Check if current role is allowed
    if (!allowedRoles.includes(userRole)) {
        throw new ForbiddenError("Insufficient permissions");
    }

    return verified;
}
