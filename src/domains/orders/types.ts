export type OrderStatus = "OPEN" | "PAYMENT_PENDING" | "PAID" | "FULFILLED" | "CANCELLED" | "REFUNDED" | "DISPUTED" | "CHARGEBACK";
export type OrderChannel = "POS" | "WEB" | "SHOPIFY" | "MERCADOLIBRE" | "RAPPI" | "UBEREATS";

export interface Order {
    id: string; // e.g. order_123
    storeId: string;
    branchId?: string; // Present if POS or specific location pickup
    registerId?: string; // Present if POS
    channel: OrderChannel;
    status: OrderStatus;
    
    // Financials
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    
    // Metadata
    customerName?: string;
    customerEmail?: string;
    notes?: string;

    // Auditing
    createdAt: number;
    updatedAt: number;
    createdByUserId?: string; // Which user created the order (useful for POS)
}

export interface OrderItem {
    id: string; // e.g. item_123
    orderId: string; // Links back to Order
    storeId: string; // Denormalized for rapid querying/security
    
    // Product snapshot
    productId: string;
    variantId: string;
    sku: string;
    name: string; // Snapshot of the name at time of sale
    
    // Financials
    quantity: number;
    unitPrice: number; // Snapshot of the price at time of sale
    subtotal: number; // quantity * unitPrice
    
    createdAt: number;
    updatedAt: number;
}
