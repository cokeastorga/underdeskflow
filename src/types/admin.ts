import { BaseProduct } from "./index";

// Product Status
export type ProductStatus = 'active' | 'draft' | 'archived';

// Shared Inventory/Price interface (used by Base Product and Variants)
export interface ProductInventory {
    price: number;
    compareAtPrice?: number;
    costPrice?: number;
    sku?: string;
    barcode?: string;
    stock: number;
    trackStock: boolean;
    allowBackorder: boolean;
    lowStockThreshold?: number;
    weight?: number;
}

export interface ProductVariant extends ProductInventory {
    id: string;
    title: string; // e.g., "Small / Red"
    options: Record<string, string>; // { "Size": "Small", "Color": "Red" }
    status: 'active' | 'out_of_stock' | 'archived';
    image?: string; // Specific image for this variant
}

export interface ProductOption {
    id: string;
    name: string; // e.g., "Size", "Color"
    values: string[]; // e.g., ["S", "M", "L"]
}

export interface ProductMedia {
    id: string;
    url: string;
    type: 'image' | 'video';
    isPrimary: boolean;
    order: number;
}

export interface AdminProduct extends Partial<BaseProduct>, Partial<ProductInventory> {
    id?: string; // Optional for new products
    title: string; // Helper for Admin (alias to name in UI often)
    slug: string; // Unique, validated
    status: ProductStatus;

    // Organization
    vendor?: string;
    category?: string;
    tags: string[];

    // Media (New structure)
    media: ProductMedia[];

    // Variants System
    hasVariants: boolean;
    options: ProductOption[];
    variants: ProductVariant[];

    // Compatibility / Frontend Helpers
    isActive?: boolean;
    images?: string[]; // Legacy array of strings for simpler handling
    image?: string;    // Main image URL

    // SEO
    seo: {
        title?: string;
        description?: string;
    };

    // Luxury / Technical Data
    brand?: string;
    model?: string;
    origin?: string;
    warranty?: string;
    careInstructions?: string;
    weight?: number;
    dimensions?: {
        length: number;
        width: number;
        height: number;
    };
    technicalSpecs?: { label: string; value: string }[];

    // Explicit overrides for BaseProduct fields that might be optional in Admin
    storeId?: string;
    createdAt?: number;
    updatedAt?: number;

    // Legacy fields
    sizes?: string[];
    displayOrder?: number;
}

