/**
 * Firebase Admin Auth helper — verifyAuth()
 *
 * Verifies a Firebase ID token from the Authorization header.
 * Returns the decoded token payload if valid.
 * Throws if the token is invalid or expired.
 */

import { getAuth } from "firebase-admin/auth";
import { adminDb } from "./admin-config";

export async function verifyAuth(idToken: string): Promise<{ uid: string; email?: string }> {
    const decoded = await getAuth().verifyIdToken(idToken);
    return { uid: decoded.uid, email: decoded.email };
}

/**
 * Verify that the given user owns the given store.
 * Returns true if ownership confirmed, false otherwise.
 */
export async function verifyStoreOwnership(uid: string, storeId: string): Promise<boolean> {
    const storeDoc = await adminDb.collection("stores").doc(storeId).get();
    if (!storeDoc.exists) return false;
    return storeDoc.data()?.ownerId === uid;
}
