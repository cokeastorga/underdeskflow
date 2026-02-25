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

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
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
    customerId?: string; // Optional for guest checkout
    customerName: string; // Denormalized for easy listing
    email: string;

    items: OrderItem[];

    subtotal: number;
    shippingCost: number;
    tax: number;
    total: number;

    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod?: string; // e.g. 'stripe', 'mercadopago', 'webpay', 'transfer'

    coupon?: {
        code: string;
        discount: number;
        type: DiscountType;
    };
    discount?: number;

    shippingAddress: {
        firstName?: string;
        lastName?: string;
        address: string;
        city: string;
        zip: string;
        country: string;
        phone: string;
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
