"use client";

import Dexie, { Table } from "dexie";

// ── Offline Sales DB Schema ─────────────────────────────────────────────────

export interface OfflineSale {
    id?: number;
    clientSaleId: string;  // uuid-v4 — idempotency key
    payload: OfflineSalePayload;
    status: "pending" | "syncing" | "synced" | "failed";
    retries: number;
    createdAt: number;
    lastAttemptAt?: number;
    error?: string;
}

export interface OfflineSalePayload {
    storeId: string;
    items: { productId: string; name: string; price: number; qty: number }[];
    paymentMethod: string;
    discount: number;
    cashSessionId?: string;
}

class POSOfflineDB extends Dexie {
    sales!: Table<OfflineSale, number>;

    constructor() {
        super("pos_offline");
        this.version(1).stores({
            sales: "++id, clientSaleId, status, createdAt",
        });
    }
}

const db = new POSOfflineDB();

// ── Offline Queue Interface ─────────────────────────────────────────────────

export const offlineQueue = {
    async add(sale: Omit<OfflineSale, "id" | "status" | "retries" | "createdAt">): Promise<number> {
        return db.sales.add({
            ...sale,
            status: "pending",
            retries: 0,
            createdAt: Date.now(),
        });
    },

    async getPending(): Promise<OfflineSale[]> {
        return db.sales.where("status").anyOf(["pending", "failed"]).toArray();
    },

    async markSyncing(id: number): Promise<void> {
        await db.sales.update(id, { status: "syncing", lastAttemptAt: Date.now() });
    },

    async markSynced(id: number): Promise<void> {
        await db.sales.update(id, { status: "synced" });
    },

    async markFailed(id: number, error: string): Promise<void> {
        const sale = await db.sales.get(id);
        await db.sales.update(id, {
            status: "failed",
            retries: (sale?.retries ?? 0) + 1,
            error,
            lastAttemptAt: Date.now(),
        });
    },

    async getPendingCount(): Promise<number> {
        return db.sales.where("status").anyOf(["pending", "failed"]).count();
    },

    async clearSynced(): Promise<void> {
        await db.sales.where("status").equals("synced").delete();
    },
};

export { db as posOfflineDB };
