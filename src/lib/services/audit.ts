import { adminDb } from "@/lib/firebase/admin-config";
import { AuditLog } from "@/types";

/**
 * Creates an immutable Audit Log entry in the specified store's subcollection.
 * Used for tracking sensitive changes, voided sales, permission changes, etc.
 * 
 * @param log Partial AuditLog containing actor, action, and entity details.
 */
export async function createAuditLog(log: Omit<AuditLog, "id" | "timestamp">) {
    try {
        const storeRef = adminDb.collection("stores").doc(log.storeId);
        const logRef = storeRef.collection("audit_logs").doc();
        
        const auditData: AuditLog = {
            id: logRef.id,
            storeId: log.storeId,
            actorId: log.actorId,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            metadata: log.metadata || {},
            timestamp: Date.now()
        };

        await logRef.set(auditData);
        return logRef.id;
    } catch (error) {
        console.error("Failed to write audit log:", error);
        // We typically don't throw here to ensure the main transaction succeeds,
        // but we do log it heavily.
    }
}
