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
        stock: data.stock || 0,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: now,
        updatedAt: now,
    };
    await docRef.set(variant);
    return variant;
}

/**
 * ATOMIC STOCK RESERVATION
 * Decrements stock and creates a reservation document within a single transaction.
 * Duration: 15 minutes.
 */
export async function reserveStock(variantId: string, quantity: number, orderId: string) {
    const reservationRef = adminDb.collection("stock_reservations").doc();
    const variantRef = variantsCol.doc(variantId);
    const reservationsCol = adminDb.collection("stock_reservations");

    return await adminDb.runTransaction(async (transaction) => {
        // --- 1. CLEANUP ON READ (for this specific variant) ---
        // We look for any PENDING reservation for this variant that has expired
        const now = Date.now();
        const expiredSnap = await transaction.get(
            reservationsCol
                .where("variantId", "==", variantId)
                .where("status", "==", "PENDING")
                .where("expiresAt", "<=", now)
        );

        let recoveredStock = 0;
        expiredSnap.docs.forEach(doc => {
            recoveredStock += doc.data().quantity;
            transaction.update(doc.ref, { status: "EXPIRED", updatedAt: now });
        });

        // --- 2. GET CURRENT VARIANT ---
        const variantDoc = await transaction.get(variantRef);
        if (!variantDoc.exists) throw new Error("Variant not found");

        const data = variantDoc.data() as Variant;
        const currentStock = (data.stock || 0) + recoveredStock;

        if (currentStock < quantity) {
            throw new Error(`Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`);
        }

        // --- 3. ATOMIC DECREMENT ---
        transaction.update(variantRef, {
            stock: currentStock - quantity,
            updatedAt: now
        });

        // --- 4. CREATE RESERVATION DOC ---
        const expiresAt = now + 15 * 60 * 1000; // 15 mins
        transaction.set(reservationRef, {
            id: reservationRef.id,
            variantId,
            orderId,
            quantity,
            storeId: data.storeId,
            expiresAt,
            status: "PENDING",
            createdAt: now,
            updatedAt: now,
        });

        return { reservationId: reservationRef.id, expiresAt };
    });
}

/**
 * RELEASE STOCK
 * Reverts stock if payment fails or reservation expires.
 */
export async function releaseStock(reservationId: string) {
    const reservationRef = adminDb.collection("stock_reservations").doc(reservationId);

    return await adminDb.runTransaction(async (transaction) => {
        const resDoc = await transaction.get(reservationRef);
        if (!resDoc.exists) return; // Already released or handled

        const resData = resDoc.data()!;
        if (resData.status === "COMPLETED") return; // Already sold

        const variantRef = variantsCol.doc(resData.variantId);
        const variantDoc = await transaction.get(variantRef);

        if (variantDoc.exists) {
            const currentStock = variantDoc.data()?.stock || 0;
            transaction.update(variantRef, {
                stock: currentStock + resData.quantity,
                updatedAt: Date.now()
            });
        }

        transaction.delete(reservationRef);
    });
}

export async function getProducts(storeId: string) {
    const snap = await productsCol.where("storeId", "==", storeId).get();
    return snap.docs.map(doc => doc.data() as Product);
}

export async function getVariantsByProduct(productId: string) {
    const snap = await variantsCol.where("productId", "==", productId).get();
    return snap.docs.map(doc => doc.data() as Variant);
}
