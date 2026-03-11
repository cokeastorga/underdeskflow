import type { User } from "firebase/auth";
import type { PermissionType } from "@/types";

/**
 * Check if a user has a specific RBAC permission.
 * Permissions are stored as a custom claim `permissions: string[]` in the Firebase ID token.
 */
export async function hasPermission(user: User, requiredPermission: PermissionType): Promise<boolean> {
    try {
        const tokenResult = await user.getIdTokenResult();
        const permissions = (tokenResult.claims.permissions as PermissionType[]) || [];
        // Super-admin override
        const isSystemAdmin = tokenResult.claims.posRole === "admin"; 
        
        return isSystemAdmin || permissions.includes(requiredPermission);
    } catch {
        return false;
    }
}

/**
 * Server-side: verify required permission from a raw token payload (in API routes).
 * Pass the decoded claims from Firebase Admin SDK.
 */
export function hasPermissionFromClaims(claims: Record<string, any>, requiredPermission: PermissionType): boolean {
    const permissions = (claims.permissions as PermissionType[]) || [];
    const isSystemAdmin = claims.posRole === "admin";
    
    return isSystemAdmin || permissions.includes(requiredPermission);
}
