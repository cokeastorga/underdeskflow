import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from '@/types';

export interface CartItem extends Product {
    cartItemId: string; // Unique ID composed of productId + variantId/options
    quantity: number;
    selectedVariantId?: string;
    selectedOptions?: Record<string, string>;
}

interface CartState {
    items: CartItem[];
    addItem: (product: Product & { selectedVariantId?: string; selectedOptions?: Record<string, string> }) => void;
    removeItem: (cartItemId: string) => void;
    updateQuantity: (cartItemId: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: () => number;
    totalPrice: () => number;
}

export const useCart = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product) => {
                const currentItems = get().items;

                // Create a unique ID for this specific configuration
                // If variantId exists, usage that. If not, use productID.
                // We also might want to append option string to be safe if variantId is missing but options exist
                const variantPart = product.selectedVariantId || (product.selectedOptions ? JSON.stringify(product.selectedOptions) : '');
                const cartItemId = `${product.id}-${variantPart}`;

                const existingItem = currentItems.find((item) => item.cartItemId === cartItemId);

                if (existingItem) {
                    set({
                        items: currentItems.map((item) =>
                            item.cartItemId === cartItemId
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        ),
                    });
                } else {
                    set({
                        items: [...currentItems, {
                            ...product,
                            cartItemId,
                            quantity: 1,
                            selectedVariantId: product.selectedVariantId,
                            selectedOptions: product.selectedOptions
                        }]
                    });
                }
            },
            removeItem: (cartItemId) => {
                set({
                    items: get().items.filter((item) => item.cartItemId !== cartItemId),
                });
            },
            updateQuantity: (cartItemId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(cartItemId);
                    return;
                }
                set({
                    items: get().items.map((item) =>
                        item.cartItemId === cartItemId ? { ...item, quantity } : item
                    ),
                });
            },
            clearCart: () => set({ items: [] }),
            totalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
            totalPrice: () =>
                get().items.reduce((total, item) => total + item.price * item.quantity, 0),
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
