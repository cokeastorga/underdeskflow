export interface CustomDomain {
    id: string; // The bare domain string used as the key, e.g. "deliciasportenas.cl"
    storeId: string; // The tenant this domain resolves to
    verified: boolean; // Managed by DNS verification logic (e.g. Vercel custom domains API)
    createdAt: number;
    updatedAt: number;
}
