export interface Category {
    id: string; // e.g. cat_123
    storeId: string;
    name: string;
    description?: string;
    parentId?: string | null;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface Product {
    id: string; // e.g. prod_123
    storeId: string;
    categoryId?: string; // Links to Category
    name: string;
    description?: string;
    brand?: string;
    tags?: string[];
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface Variant {
    id: string; // e.g. var_123
    productId: string; // Links to Product
    storeId: string; // Denormalized for rapid querying
    sku: string;
    name?: string; // e.g. "Size L, Red"
    basePrice: number;
    costPrice?: number;
    barcode?: string;
    stock: number; // Current physical stock
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
}
