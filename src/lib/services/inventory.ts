import { doc, getDoc, updateDoc, increment, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { OrderItem, Product } from "@/types";

/**
 * Decrements stock for a list of order items.
 * Handles both simple products and variants.
 */
export const decrementStock = async (items: OrderItem[]) => {
    if (!items || items.length === 0) return;

    try {
        await runTransaction(db, async (transaction) => {
            for (const item of items) {
                const productRef = doc(db, "products", item.productId);
                const productSnap = await transaction.get(productRef);

                if (!productSnap.exists()) {
                    console.warn(`Product ${item.productId} not found during stock decrement`);
                    continue;
                }

                const productData = productSnap.data() as Product;

                if (productData.hasVariants && item.variantId) {
                    // Handle Variant Stock
                    const variants = productData.variants || [];
                    const variantIndex = variants.findIndex(v => v.id === item.variantId);

                    if (variantIndex === -1) {
                        console.warn(`Variant ${item.variantId} not found for product ${item.productId}`);
                        continue;
                    }

                    const currentStock = variants[variantIndex].stock || 0;
                    if (currentStock < item.quantity && !productData.allowBackorder) {
                        throw new Error(`Insufficient stock for variant ${variants[variantIndex].title}`);
                    }

                    // Update variant stock
                    variants[variantIndex].stock = Math.max(0, currentStock - item.quantity);

                    // Update total product stock (sum of variants)
                    const newTotalStock = variants.reduce((acc, v) => acc + (v.stock || 0), 0);

                    transaction.update(productRef, {
                        variants: variants,
                        stock: newTotalStock,
                        updatedAt: Date.now()
                    });

                } else {
                    // Handle Simple Product Stock
                    const currentStock = productData.stock || 0;
                    if (currentStock < item.quantity && !productData.allowBackorder) {
                        throw new Error(`Insufficient stock for product ${productData.name}`);
                    }

                    transaction.update(productRef, {
                        stock: Math.max(0, currentStock - item.quantity),
                        updatedAt: Date.now()
                    });
                }
            }
        });
        console.log("Stock decremented successfully");
    } catch (error) {
        console.error("Error decrementing stock:", error);
        throw error; // Propagate error to handle it in UI/Caller if needed
    }
};
