export interface BaseProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    storeId: string;
    createdAt?: number;
    updatedAt?: number;
}

export interface InventoryMovement {
    id: string;
    productId: string;
    locationId?: string; // Optional if we consider global location for now
    storeId: string;
    
    type: "sale" | "purchase" | "adjustment" | "return" | "transfer";
    quantity: number; // Positive (in) or Negative (out)
    balanceAfter: number; // Snapshot
    
    referenceId: string; // e.g. orderId, transferId, auditId
    actor: string; // Who made the movement (admin, system, customer_checkout)
    notes?: string;
    timestamp: number;
}

export interface Category {
    id: string;
    storeId: string;

    name: string;
    slug: string;
    description?: string;
    image?: string;

    parentId?: string;   // Support for subcategories
    isActive: boolean;   // Enable/disable without deleting
    sortOrder: number;   // Manual sort order

    /**
     * Map of channel IDs to markup percentages.
     * Example: { "shopify-1": 10 } adds 10% to products in this category for that channel.
     */
    channelMarkups?: Record<string, number>;

    createdAt: number;
    updatedAt: number;
}

export interface ProductVariant {
    id: string;
    title: string;
    options: Record<string, string>;
    price: number;
    stock: number;
    sku?: string;
    barcode?: string;
    status: 'active' | 'out_of_stock' | 'archived';
    image?: string;
}

export interface Product extends BaseProduct {
    isNew?: boolean;
    size?: string;
    isFeatured?: boolean;
    freeShipping?: boolean;

    // Inventory & Organization
    sku?: string;
    barcode?: string;
    trackStock?: boolean;
    stock?: number;
    allowBackorder?: boolean;
    lowStockThreshold?: number;

    // Luxury / Technical Data
    brand?: string;
    model?: string;
    origin?: string; // e.g. "Made in Italy"
    warranty?: string; // e.g. "2 Years"
    careInstructions?: string; // e.g. "Dry Clean Only"
    weight?: number; // in kg or g
    dimensions?: {
        length: number;
        width: number;
        height: number;
    };
    technicalSpecs?: { label: string; value: string }[]; // e.g. [{ label: "Material", value: "Silk" }]

    // Media
    images?: string[]; // Legacy/Simple image array
    media?: {
        id: string;
        url: string;
        type: "image" | "video";
        isPrimary: boolean;
        order: number;
    }[];

    // Reviews (Aggregated)
    rating?: number;
    reviewCount?: number;

    // Variants
    hasVariants?: boolean;
    variants?: ProductVariant[];
    options?: { id: string; name: string; values: string[] }[];

    /**
     * Permanent overrides for specific channels.
     * Key is connectionId or channelType.
     */
    channelOverrides?: Record<string, {
        price?: number;
        sku?: string;
        active?: boolean;
    }>;
}

export interface Review {
    id: string;
    storeId: string;
    productId: string;
    customerId?: string; // If logged in
    customerName: string;
    rating: number; // 1-5
    comment: string;
    images?: string[]; // Optional user uploads
    isVerifiedPurchase: boolean;
    status: "pending" | "approved" | "rejected";
    createdAt: number;
}

export interface CarouselSlide {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    ctaText: string;
    ctaLink: string;
}

export interface PromoBanner {
    id: string;
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    backgroundColor: string; // e.g. "bg-blue-900" or hex
    position: number; // 1, 2, 3... to determine order/placement
}

export type OrderStatus = "open" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "authorized" | "paid" | "partially_refunded" | "refunded";
export type FulfillmentStatus = "unfulfilled" | "preparing" | "fulfilled" | "delivered";
export type DiscountType = 'percentage' | 'fixed_amount';

export interface OrderItem {
    productId: string;
    variantId?: string;
    name: string;
    sku?: string;
    price: number;
    quantity: number;
    image?: string;
}

export interface Order {
    id: string; // Firestore ID
    orderNumber: string; // Human readable #1001
    storeId: string;
    channel: "pos" | "online" | "marketplace";
    locationId?: string; // Para identificar en qué sucursal ocurrió
    
    customerId?: string; // Optional for guest checkout
    customerName: string; // Denormalized for easy listing
    email: string;

    items: OrderItem[];

    totals: {
        subtotal: number;
        discount: number;
        tax: number;
        shipping?: number;
        total: number;
    };

    status: OrderStatus;
    paymentStatus: PaymentStatus;
    fulfillmentStatus: FulfillmentStatus;
    
    paymentMethod?: string; // e.g. 'stripe', 'mercadopago', 'webpay', 'transfer'
    provider?: string;

    coupon?: {
        code: string;
        discount: number;
        type: DiscountType;
    };
    discount?: number;

    shippingAddress?: {
        firstName?: string;
        lastName?: string;
        address: string;
        city: string;
        zip?: string;
        country?: string;
        region?: string;
        phone: string;
    } | null;
    
    shippingCarrier?: string | null;
    deliveryMethod?: string;
    couponId?: string | null;
    rut?: string;
    phone?: string;

    audit?: {
        createdBy: string;
    };

    createdAt: number;
    updatedAt: number;
}




export interface Customer {
    id: string;
    storeId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate?: number;
    addresses: {
        type: 'shipping' | 'billing';
        address: string;
        city: string;
        zip: string;
        country: string;
        phone: string;
    }[];
    createdAt: number;
    updatedAt: number;
}

export interface Banner {
    id: string;
    storeId: string;
    title: string;
    subtitle?: string;
    image: string;
    link?: string;
    position: 'home' | 'collection' | 'checkout';
    isActive: boolean;
    startDate?: number; // timestamp
    endDate?: number; // timestamp
    createdAt: number;
    updatedAt: number;
}

export interface Coupon {
    id: string;
    storeId: string;
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    minOrderAmount?: number;
    maxUses?: number;
    usedCount: number;
    isActive: boolean;
    startsAt?: number;
    endsAt?: number;
    createdAt: number;
    updatedAt: number;
}

export interface Location {
    id: string;
    storeId: string;
    name: string;
    address: string;
    hours?: string;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface StoreConfig {
    id: string;
    name: string;
    description?: string;
    logo?: string;
    ownerId: string;
    createdAt: number;
    currency: string;

    contactEmail?: string;
    phoneNumber?: string;
    socialLinks?: {
        instagram?: string;
        facebook?: string;
        twitter?: string;
    };

    /** @deprecated Use PaymentOrchestrator (Model B) and Stripe Connect instead. */
    apiKeys?: {
        stripe?: string;
        mercadoPago?: string;
        transbank?: string;
    };
    design?: {
        heroCarousel?: CarouselSlide[];
        promoBanners?: PromoBanner[];
    };
}

export interface Location {
    id: string;
    storeId: string;
    name: string;      // e.g. "Main Street Store"
    isMain: boolean;   // Headquarter or primary branch
    locationAddress: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    phone?: string;
    status: "active" | "inactive";
    createdAt: number;
    updatedAt: number;
}

export interface Device {
    id: string;
    storeId: string;
    locationId: string;
    name: string;      // e.g. "Register 1", "Kitchen Printer A"
    type: "pos" | "printer" | "display" | "kitchen_screen";
    status: "online" | "offline" | "maintenance";
    settings?: Record<string, any>; // e.g. { printerIp: "192.168.1.100" }
    lastActiveAt?: number;
    createdAt: number;
    updatedAt: number;
}

export type PermissionType = 
    | "pos_access" 
    | "manage_inventory" 
    | "void_sale" 
    | "refund_payment" 
    | "view_reports" 
    | "manage_staff" 
    | "manage_settings";

export interface Role {
    id: string;
    storeId: string;
    name: string;        // e.g. "Manager", "Cashier"
    description: string;
    permissions: PermissionType[];
    isSystem?: boolean;  // e.g. "admin" cannot be deleted
    createdAt: number;
    updatedAt: number;
}

export interface StoreUser {
    id: string;
    storeId: string;
    uid: string;         // Firebase Auth UID
    email: string;
    displayName: string;
    roleId: string;      // Links to Role.id
    status: "active" | "inactive";
    createdAt: number;
    updatedAt: number;
}

export interface AuditLog {
    id: string;
    storeId: string;
    actorId: string; // userId or 'system'
    action: string;  // e.g. 'order_created', 'inventory_adjusted'
    entityType: string;
    entityId: string;
    metadata?: Record<string, any>;
    timestamp: number;
}
