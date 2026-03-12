import { adminDb } from "@/lib/firebase/admin-config";
import { CustomDomain } from "./types";

const domainsCol = adminDb.collection("domains");

export async function addCustomDomain(storeId: string, domainName: string) {
    const sanitizedDomain = domainName.toLowerCase().trim();
    const docRef = domainsCol.doc(sanitizedDomain);
    
    return await adminDb.runTransaction(async (transaction) => {
        const snap = await transaction.get(docRef);
        if (snap.exists) {
            throw new Error(`Domain ${sanitizedDomain} is already registered.`);
        }
        
        const now = Date.now();
        const customDomain: CustomDomain = {
            id: sanitizedDomain,
            storeId,
            verified: false,
            createdAt: now,
            updatedAt: now,
        };
        
        transaction.set(docRef, customDomain);
        return customDomain;
    });
}

export async function getStoreDomains(storeId: string) {
    const snap = await domainsCol.where("storeId", "==", storeId).get();
    return snap.docs.map(doc => doc.data() as CustomDomain);
}

export async function verifyDomain(domainName: string, isVerified: boolean) {
    const sanitizedDomain = domainName.toLowerCase().trim();
    await domainsCol.doc(sanitizedDomain).update({
        verified: isVerified,
        updatedAt: Date.now()
    });
}

export async function removeCustomDomain(domainName: string) {
    const sanitizedDomain = domainName.toLowerCase().trim();
    await domainsCol.doc(sanitizedDomain).delete();
}
