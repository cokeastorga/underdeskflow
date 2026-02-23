/**
 * Outbox Service — Persistent event staging for the Multistore Platform.
 * 
 * Implements the Outbox Pattern to ensure at-least-once delivery of external 
 * sync events and financial transactions.
 * 
 * Flow:
 * 1. Business logic writes to DB + Stage in Outbox (atomic if possible)
 * 2. Outbox Worker polls Outbox and executes background work
 * 3. On success, Worker marks Outbox entry as SENT
 */

import { v4 as uuidv4 } from "uuid";
import { adminDb } from "@/lib/firebase/admin-config";

export type OutboxEventType =
    | "STOCK_WRITEBACK"
    | "PRICE_WRITEBACK"
    | "ORDER_INGESTED"
    | "LEDGER_TRANSACTION";

export interface OutboxEntry {
    id: string;
    storeId: string;
    type: OutboxEventType;
    payload: any;
    priority: "HIGH" | "MEDIUM" | "LOW";
    status: "PENDING" | "PROCESSING" | "SENT" | "FAILED";
    attempts: number;
    maxAttempts: number;
    lastError?: string;
    traceId: string;
    correlationId?: string;
    scheduledFor?: number;
    createdAt: number;
    processedAt?: number;
}

export class OutboxService {
    private collection = "outbox_events";

    /**
     * Enqueue an event for background processing.
     * This should be called within the same transaction as the related data update.
     */
    async enqueue(
        storeId: string,
        type: OutboxEventType,
        payload: any,
        options: {
            priority?: "HIGH" | "MEDIUM" | "LOW",
            traceId?: string,
            correlationId?: string,
            maxAttempts?: number
        } = {}
    ): Promise<string> {
        const id = uuidv4();
        const entry: OutboxEntry = {
            id,
            storeId,
            type,
            payload,
            priority: options.priority || "MEDIUM",
            status: "PENDING",
            attempts: 0,
            maxAttempts: options.maxAttempts || 5,
            traceId: options.traceId || uuidv4(),
            correlationId: options.correlationId,
            createdAt: Date.now(),
        };

        await adminDb.collection("stores").doc(storeId)
            .collection(this.collection).doc(id)
            .set(entry);

        return id;
    }

    /**
     * Mark an entry as being processed to avoid double execution.
     */
    async markProcessing(storeId: string, id: string): Promise<void> {
        await adminDb.collection("stores").doc(storeId)
            .collection(this.collection).doc(id)
            .update({ status: "PROCESSING" });
    }

    /**
     * Finalize an outbox entry.
     */
    async markSent(storeId: string, id: string): Promise<void> {
        await adminDb.collection("stores").doc(storeId)
            .collection(this.collection).doc(id)
            .update({
                status: "SENT",
                processedAt: Date.now()
            });
    }

    /**
     * Record a failure and increment attempts.
     */
    async recordFailure(storeId: string, id: string, error: string): Promise<void> {
        const docRef = adminDb.collection("stores").doc(storeId)
            .collection(this.collection).doc(id);

        const snap = await docRef.get();
        if (!snap.exists) return;

        const data = snap.data() as OutboxEntry;
        const newAttempts = data.attempts + 1;
        const newStatus = newAttempts >= data.maxAttempts ? "FAILED" : "PENDING";

        await docRef.update({
            attempts: newAttempts,
            status: newStatus,
            lastError: error,
            scheduledFor: Date.now() + Math.pow(2, newAttempts) * 1000 // Exponential backoff
        });
    }
}

export const outboxService = new OutboxService();
