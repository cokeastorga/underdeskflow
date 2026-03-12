export type PaymentProvider = "MERCADOPAGO" | "SUMUP" | "CASH" | "TRANSFER";
export type PaymentIntentStatus = "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED";

export interface PaymentIntent {
    id: string; // e.g. pi_12345
    orderId: string;
    storeId: string;
    
    amount: number;
    provider: PaymentProvider;
    deviceId?: string; // e.g. "mp-point-01" or SumUp reader ID
    
    status: PaymentIntentStatus;
    
    // Safety Net
    idempotencyKey: string; // e.g. "order_123-device_555" (Combats retry anomalies)
    
    // Webhook correlation
    providerTransactionId?: string; // ID assigned by MP/SumUp after creation/webhook
    
    createdAt: number;
    updatedAt: number;
}
