import { Order, OrderStatus, PaymentStatus, FulfillmentStatus } from "@/types";

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export interface SumUpTransaction {
    id: string;
    transaction_code: string;
    amount: number;
    currency: string;
    timestamp: string;
    status: "SUCCESSFUL" | "CANCELLED" | "FAILED" | "PENDING";
    payment_type: string;
    installments_count: number;
    merchant_code: string;
    vat_amount: number;
    tip_amount: number;
    entry_mode: string;
    auth_code: string;
    internal_id: number;
}

export interface SumUpMerchantProfile {
    merchant_code: string;
    company_name: string;
    currency: string;
    country: string;
    username: string;
}

export interface MigrationResult {
    total: number;
    imported: number;
    failed: number;
    duplicates: number;
    errors: string[];
}

export interface PaginatedTransactions {
    items: SumUpTransaction[];
    total: number;
    hasMore: boolean;
    offset: number;
}

// ────────────────────────────────────────────────────────────────
// Service
// ────────────────────────────────────────────────────────────────

export class SumUpService {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private get headers() {
        return {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
        };
    }

    /** Validate the API key and retrieve merchant profile. */
    async getMerchantProfile(): Promise<SumUpMerchantProfile> {
        const response = await fetch("https://api.sumup.com/v0.1/me", {
            headers: this.headers,
        });
        if (!response.ok) {
            throw new Error(`SumUp Auth Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }

    /**
     * Fetch a paginated page of transaction history.
     * SumUp API limit is 100 items max per request.
     * Always returns raw SumUpTransaction items.
     */
    async getTransactions(
        limit: number = 20,
        offset: number = 0
    ): Promise<PaginatedTransactions> {
        const clampedLimit = Math.min(limit, 100);
        const response = await fetch(
            `https://api.sumup.com/v0.1/me/transactions/history?limit=${clampedLimit}&offset=${offset}&order=descending`,
            { headers: this.headers }
        );

        if (!response.ok) {
            throw new Error(`SumUp API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        // SumUp returns either an array or { items: [...] }
        const rawItems: SumUpTransaction[] = Array.isArray(data)
            ? data
            : (data.items ?? []);

        return {
            items: rawItems,
            total: data.total ?? rawItems.length,
            hasMore: rawItems.length === clampedLimit,
            offset: offset + rawItems.length,
        };
    }

    /** Normalize a SumUp transaction into our Order shape. */
    normalizeTransaction(tx: SumUpTransaction, storeId?: string): Partial<Order> {
        const date = new Date(tx.timestamp);

        let status: OrderStatus = "open";
        let paymentStatus: PaymentStatus = "pending";
        let fulfillmentStatus: FulfillmentStatus = "unfulfilled";

        if (tx.status === "SUCCESSFUL") {
            status = "completed";
            paymentStatus = "paid";
            fulfillmentStatus = "fulfilled";
        } else if (tx.status === "CANCELLED") {
            status = "cancelled";
            paymentStatus = "refunded";
        } else if (tx.status === "FAILED") {
            status = "cancelled";
            paymentStatus = "refunded";
        }

        return {
            orderNumber: tx.transaction_code,
            channel: "pos",
            totals: {
                total: tx.amount,
                subtotal: tx.amount,
                tax: tx.vat_amount || 0,
                shipping: 0,
                discount: 0
            },
            status,
            paymentStatus,
            fulfillmentStatus,
            paymentMethod: `sumup_${tx.payment_type}`,
            storeId,
            createdAt: date.getTime(),
            updatedAt: date.getTime(),
            items: [
                {
                    productId: "migration_placeholder",
                    name: "Imported Transaction",
                    price: tx.amount,
                    quantity: 1,
                },
            ],
            customerName: "Guest (SumUp)",
            email: "",
            shippingAddress: {
                address: "SumUp Point of Sale",
                city: "",
                country: "",
                zip: "",
                phone: "",
            },
        };
    }
}
