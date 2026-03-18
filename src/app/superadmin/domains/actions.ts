"use server";

import { adminDb } from "@/lib/firebase/admin-config";
import dns from "dns";
import { promisify } from "util";

const resolveA = promisify(dns.resolve4);
const resolveCname = promisify(dns.resolveCname);
const resolveTxt = promisify(dns.resolveTxt);

const PLATFORM_IPS = ["75.2.60.5"]; // Example Vercel/Platform IP
const PLATFORM_CNAME = "underdeskflow.cl";

export interface DomainStatus {
    domain: string;
    storeName: string;
    type: "subdomain" | "custom";
    isValid: boolean;
    records?: string[];
    error?: string;
    challengeToken?: string;
    expiresAt?: number;
    status: "pending" | "verified" | "expired";
}

export interface DomainChallenge {
    token: string;
    expiresAt: number;
    dnsRecord: string;
}

export async function getPlatformDomains(): Promise<DomainStatus[]> {
    const storesSnap = await adminDb.collection("stores")
        .where("customDomain", "!=", null)
        .limit(100)
        .get();

    const results: DomainStatus[] = [];

    for (const doc of storesSnap.docs) {
        const data = doc.data();
        const expiresAt = data.domainVerificationExpiresAt;
        let status: "pending" | "verified" | "expired" = data.domainVerificationStatus || "pending";
        
        if (status === "pending" && expiresAt && Date.now() > expiresAt) {
            status = "expired";
        }

        results.push({
            domain: data.customDomain,
            storeName: data.name || doc.id,
            type: data.customDomain.includes("udf.cl") ? "subdomain" : "custom",
            isValid: status === "verified",
            challengeToken: data.domainVerificationToken,
            expiresAt,
            status
        });
    }

    return results;
}

export async function verifyDomainDns(domain: string): Promise<{ isValid: boolean, records: string[], error?: string }> {
    try {
        // Try CNAME first (most common for SaaS)
        try {
            const cnames = await resolveCname(domain);
            const isValid = cnames.some(c => c.toLowerCase().includes(PLATFORM_CNAME));
            return { isValid, records: cnames };
        } catch (e) {
            // Fallback to A record
            const ips = await resolveA(domain);
            const isValid = ips.some(ip => PLATFORM_IPS.includes(ip));
            return { isValid, records: ips };
        }
    } catch (err: any) {
        return { isValid: false, records: [], error: err.code === "ENODATA" ? "Sin registros encontrados" : "Error de red" };
    }
}
export async function generateDomainChallenge(storeId: string): Promise<DomainChallenge> {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    await adminDb.collection("stores").doc(storeId).update({
        domainVerificationToken: token,
        domainVerificationExpiresAt: expiresAt,
        domainVerificationStatus: "pending",
        updatedAt: Date.now()
    });

    return {
        token,
        expiresAt,
        dnsRecord: `udf-verification=${token}`
    };
}

export async function verifyDomainChallenge(domain: string, expectedToken: string, expiresAt: number): Promise<{ isValid: boolean, error?: string }> {
    if (Date.now() > expiresAt) {
        return { isValid: false, error: "Token de verificación expirado (24h)" };
    }

    try {
        const records = await resolveTxt(domain);
        const isValid = records.some(r => r.join("").includes(`udf-verification=${expectedToken}`));
        return { 
            isValid, 
            error: isValid ? undefined : "No se encontró el registro TXT de verificación" 
        };
    } catch (err) {
        return { isValid: false, error: "No se pudieron consultar los registros TXT" };
    }
}
