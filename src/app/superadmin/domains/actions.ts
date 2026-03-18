"use server";

import { adminDb } from "@/lib/firebase/admin-config";
import dns from "dns";
import { promisify } from "util";

const resolveA = promisify(dns.resolve4);
const resolveCname = promisify(dns.resolveCname);

const PLATFORM_IPS = ["75.2.60.5"]; // Example Vercel/Platform IP
const PLATFORM_CNAME = "underdeskflow.cl";

export interface DomainStatus {
    domain: string;
    storeName: string;
    type: "subdomain" | "custom";
    isValid: boolean;
    records?: string[];
    error?: string;
}

export async function getPlatformDomains(): Promise<DomainStatus[]> {
    const storesSnap = await adminDb.collection("stores")
        .where("customDomain", "!=", null)
        .limit(100)
        .get();

    const results: DomainStatus[] = [];

    for (const doc of storesSnap.docs) {
        const data = doc.data();
        results.push({
            domain: data.customDomain,
            storeName: data.name || doc.id,
            type: data.customDomain.includes("udf.cl") ? "subdomain" : "custom",
            isValid: false // To be checked by verifyDomain
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
