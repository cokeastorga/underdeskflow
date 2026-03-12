import { logger } from "@/lib/logger";

export type DomainEventName = "order.paid" | "inventory.movement_created" | "payment.succeeded";

export async function emitEvent(eventName: DomainEventName, payload: any) {
    const requestId = crypto.randomUUID();
    
    logger.info("Event emitted", {
        requestId,
        event: eventName,
        storeId: payload?.storeId,
        orderId: payload?.orderId
    });
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    try {
        fetch(`${appUrl}/api/workers/events`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                event: eventName,
                payload,
                requestId,
                timestamp: Date.now()
            })
        }).catch(err => {
            logger.error(`Background HTTP dispatch failed for ${eventName}`, { requestId, error: err });
        });
    } catch (e) {
        logger.error(`Failed to emit ${eventName}`, { requestId, error: e });
    }
}
