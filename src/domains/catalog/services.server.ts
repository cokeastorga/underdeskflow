import { adminDb } from "@/lib/firebase/admin-config";
import { Category, Product, Variant } from "./types";

const categoriesCol = adminDb.collection("categories");
const productsCol = adminDb.collection("products");
const variantsCol = adminDb.collection("variants");

export async function createCategory(storeId: string, data: Partial<Category>) {
    const docRef = categoriesCol.doc();
    const id = `cat_${docRef.id}`;
    const now = Date.now();
    const cat: Category = {
        id,
        storeId,
        name: data.name || "Nueva Categoria",
        description: data.description,
        parentId: data.parentId || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: now,
        updatedAt: now,
    };
    await docRef.set(cat);
    return cat;
}

export async function createProduct(storeId: string, data: Partial<Product>) {
    const docRef = productsCol.doc();
    const id = `prod_${docRef.id}`;
    const now = Date.now();
    const prod: Product = {
        id,
        storeId,
        categoryId: data.categoryId,
        name: data.name || "Nuevo Producto",
        description: data.description,
        brand: data.brand,
        tags: data.tags || [],
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: now,
        updatedAt: now,
    };
    await docRef.set(prod);
    return prod;
}

export async function createVariant(storeId: string, productId: string, data: Partial<Variant>) {
    const docRef = variantsCol.doc();
    const id = `var_${docRef.id}`;
    const now = Date.now();
    const variant: Variant = {
        id,
        storeId,
        productId,
        sku: data.sku || id,
        name: data.name,
        basePrice: data.basePrice || 0,
        costPrice: data.costPrice,
        barcode: data.barcode,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: now,
        updatedAt: now,
    };
    await docRef.set(variant);
    return variant;
}

export async function getProducts(storeId: string) {
    const snap = await productsCol.where("storeId", "==", storeId).get();
    return snap.docs.map(doc => doc.data() as Product);
}

export async function getVariantsByProduct(productId: string) {
    const snap = await variantsCol.where("productId", "==", productId).get();
    return snap.docs.map(doc => doc.data() as Variant);
}
