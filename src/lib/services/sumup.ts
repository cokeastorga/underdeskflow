import { Order, OrderStatus, PaymentStatus } from "@/types";

export interface SumUpTransaction {
    id: string;
    transaction_code: string;
    amount: number;
    currency: string;
    timestamp: string;
    status: 'SUCCESSFUL' | 'CANCELLED' | 'FAILED' | 'PENDING';
    payment_type: string;
    installments_count: number;
    merchant_code: string;
    vat_amount: number;
    tip_amount: number;
    entry_mode: string;
    auth_code: string;
    internal_id: number;
}

export interface MigrationResult {
    total: number;
    imported: number;
    failed: number;
    duplicates: number;
    errors: string[];
}

export class SumUpService {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async getTransactions(limit: number = 100, normalize: boolean = true): Promise<any[]> {
        const response = await fetch(`https://api.sumup.com/v0.1/me/transactions/history?limit=${limit}&order=descending`, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`SumUp API Error: ${response.statusText}`);
        }

        const data = await response.json();
        const transactions = data.items || []; // SumUp returns { items: [...] } usually, or just array? Docs say array but checking wrapper is safer.
        // Actually checking docs again, usually it returns an array of transactions for history endpoint directly?
        // Let's assume array for now based on snippet, but handle wrapper if needed.
        // The list API usually returns { items: [...] } or just [...]
        // Let's safe check.
        const items = Array.isArray(data) ? data : (data.items || []);

        return normalize ? items.map(this.normalizeTransaction) : items;
    }

    private normalizeTransaction(tx: SumUpTransaction): Partial<Order> {
        const date = new Date(tx.timestamp);

        // Map SumUp status to our status
        let status: OrderStatus = 'pending';
        let paymentStatus: PaymentStatus = 'pending';

        if (tx.status === 'SUCCESSFUL') {
            status = 'delivered'; // Assume completed transaction is delivered for migration purposes
            paymentStatus = 'paid';
        } else if (tx.status === 'CANCELLED') {
            status = 'cancelled';
            paymentStatus = 'refunded'; // or failed
        } else if (tx.status === 'FAILED') {
            status = 'cancelled';
            paymentStatus = 'failed';
        }

        return {
            orderNumber: tx.transaction_code,
            total: tx.amount,
            subtotal: tx.amount, // VAT handling might be needed if included
            tax: tx.vat_amount || 0,
            shippingCost: 0,
            status,
            paymentStatus,
            paymentMethod: `sumup_${tx.payment_type}`,
            createdAt: date.getTime(),
            updatedAt: date.getTime(),
            // Mock items since SumUp transaction list doesn't have line items usually
            items: [{
                productId: 'migration_placeholder',
                name: 'Imported Transaction',
                price: tx.amount,
                quantity: 1
            }],
            customerName: 'Guest (SumUp)',
            email: '',
            shippingAddress: {
                address: 'SumUp Point of Sale',
                city: '',
                country: '',
                zip: '',
                phone: ''
            }
        };
    }
}
