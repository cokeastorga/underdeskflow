export type PayoutStatus = "PENDING" | "SCHEDULED" | "PAID" | "FAILED";

export interface PaymentLedgerEntry {
    id: string;             // e.g. pay_123
    orderId: string;
    storeId: string;
    orderTotal: number;
    gatewayFee: number | null;  // Nullable for async T+1 reconciliation
    provider: "WEBPAY" | "MERCADOPAGO" | "FLOW" | "STRIPE";
    capturedAt: number;
}

export interface PlatformFee {
    id: string;             // e.g. fee_123
    storeId: string;
    orderId: string;
    feePercent: number;     // e.g. 0.08
    feeAmount: number;
    status: "PENDING" | "COLLECTED";
    createdAt: number;
}

export interface PayoutBatch {
    id: string;             // e.g. batch_123
    storeId: string;
    periodStart: number;
    periodEnd: number;
    totalGross: number;
    totalGatewayFees: number;
    totalPlatformFees: number;
    netPayout: number;
    status: PayoutStatus;
    createdAt: number;
    paidAt?: number;
}
