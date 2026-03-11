import { doc, getDoc, updateDoc, increment, runTransaction, collection, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { InventoryMovement, OrderItem, Product } from "@/types";

interface InventoryContext {
    storeId: string;
    referenceId: string; // Order ID, Return ID, etc.
    actor: string; // userId, "system", "customer_checkout", etc.
    notes?: string;
    locationId?: string;
}

/**
 * Decrements stock for a list of order items and logs InventoryMovements.
 * Handles both simple products and variants.
 */
export const decrementStock = async (items: OrderItem[], context: InventoryContext) => {
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
                let balanceAfter = 0;

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

                    balanceAfter = Math.max(0, currentStock - item.quantity);
                    variants[variantIndex].stock = balanceAfter;

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

                    balanceAfter = Math.max(0, currentStock - item.quantity);
                    transaction.update(productRef, {
                        stock: balanceAfter,
                        updatedAt: Date.now()
                    });
                }

                // 2. Create the Inventory Movement Log
                const movementRef = doc(collection(db, `stores/${context.storeId}/inventory_movements`));
                const movement: InventoryMovement = {
                    id: movementRef.id,
                    productId: item.productId,
                    locationId: context.locationId || "default",
                    storeId: context.storeId,
                    type: "sale",
                    quantity: -item.quantity, // Negative for decrements
                    balanceAfter,
                    referenceId: context.referenceId,
                    actor: context.actor,
                    notes: context.notes || `Sold ${item.quantity} units`,
                    timestamp: Date.now()
                };

                transaction.set(movementRef, movement);
            }
        });
        console.log("Stock decremented successfully with Event Sourcing logs.");
    } catch (error) {
        console.error("Error decrementing stock:", error);
        throw error;
    }
};

/**
 * Increments stock for a list of order items and logs InventoryMovements.
 * Useful for Restocks, Returns, or Order Cancellations.
 */
export const incrementStock = async (
    items: { productId: string; variantId?: string; quantity: number }[],
    context: InventoryContext,
    type: InventoryMovement["type"] = "return"
) => {
    if (!items || items.length === 0) return;

    try {
        await runTransaction(db, async (transaction) => {
            for (const item of items) {
                const productRef = doc(db, "products", item.productId);
                const productSnap = await transaction.get(productRef);

                if (!productSnap.exists()) {
                    console.warn(`Product ${item.productId} not found during stock increment`);
                    continue;
                }

                const productData = productSnap.data() as Product;
                let balanceAfter = 0;

                if (productData.hasVariants && item.variantId) {
                    const variants = productData.variants || [];
                    const variantIndex = variants.findIndex(v => v.id === item.variantId);

                    if (variantIndex !== -1) {
                        const currentStock = variants[variantIndex].stock || 0;
                        balanceAfter = currentStock + item.quantity;
                        variants[variantIndex].stock = balanceAfter;
                        
                        const newTotalStock = variants.reduce((acc, v) => acc + (v.stock || 0), 0);
                        transaction.update(productRef, {
                            variants: variants,
                            stock: newTotalStock,
                            updatedAt: Date.now()
                        });
                    }
                } else {
                    const currentStock = productData.stock || 0;
                    balanceAfter = currentStock + item.quantity;
                    transaction.update(productRef, {
                        stock: balanceAfter,
                        updatedAt: Date.now()
                    });
                }

                // Create the Inventory Movement Log
                const movementRef = doc(collection(db, `stores/${context.storeId}/inventory_movements`));
                const movement: InventoryMovement = {
                    id: movementRef.id,
                    productId: item.productId,
                    locationId: context.locationId || "default",
                    storeId: context.storeId,
                    type,
                    quantity: item.quantity, // Positive for increments
                    balanceAfter,
                    referenceId: context.referenceId,
                    actor: context.actor,
                    notes: context.notes || `Incremented ${item.quantity} units (${type})`,
                    timestamp: Date.now()
                };

                transaction.set(movementRef, movement);
            }
        });
        console.log("Stock incremented successfully with Event Sourcing logs.");
    } catch (error) {
        console.error("Error incrementing stock:", error);
        throw error;
    }
};
