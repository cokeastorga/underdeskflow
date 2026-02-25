import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from '@/types';
import { toast } from 'sonner';

export interface CartItem extends Product {
    cartItemId: string; // Unique ID composed of productId + variantId/options
    storeId: string;    // ID of the store this item belongs to
    quantity: number;
    selectedVariantId?: string;
    selectedOptions?: Record<string, string>;
}

interface CartState {
    items: CartItem[];
    addItem: (product: Product & { selectedVariantId?: string; selectedOptions?: Record<string, string> }, storeId: string) => void;
    removeItem: (cartItemId: string) => void;
    updateQuantity: (cartItemId: string, quantity: number) => void;
    clearCart: (storeId?: string) => void;
    totalItems: (storeId?: string) => number;
    totalPrice: (storeId?: string) => number;
}

export const useCart = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product, storeId) => {
                const currentItems = get().items;

                // Create a unique ID for this specific configuration
                const variantPart = product.selectedVariantId || (product.selectedOptions ? JSON.stringify(product.selectedOptions) : '');
                const cartItemId = `${storeId}-${product.id}-${variantPart}`;

                const existingItem = currentItems.find((item) => item.cartItemId === cartItemId);

                // Stock validation
                const availableStock = product.stock !== undefined ? product.stock : 999;
                const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

                if (newQuantity > availableStock) {
                    toast.error(`Lo sentimos, solo quedan ${availableStock} unidades disponibles.`);
                    return;
                }

                if (existingItem) {
                    set({
                        items: currentItems.map((item) =>
                            item.cartItemId === cartItemId
                                ? { ...item, quantity: newQuantity }
                                : item
                        ),
                    });
                } else {
                    set({
                        items: [...currentItems, {
                            ...product,
                            cartItemId,
                            storeId,
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

                const item = get().items.find(i => i.cartItemId === cartItemId);
                if (item) {
                    // Stock validation
                    const availableStock = item.stock !== undefined ? item.stock : 999;
                    if (quantity > availableStock) {
                        toast.error(`Solo hay ${availableStock} unidades en stock.`);
                        return;
                    }
                }

                set({
                    items: get().items.map((item) =>
                        item.cartItemId === cartItemId ? { ...item, quantity } : item
                    ),
                });
            },
            clearCart: (storeId) => {
                if (storeId) {
                    set({ items: get().items.filter(item => item.storeId !== storeId) });
                } else {
                    set({ items: [] });
                }
            },
            totalItems: (storeId) => {
                const items = storeId ? get().items.filter(item => item.storeId === storeId) : get().items;
                return items.reduce((total, item) => total + item.quantity, 0);
            },
            totalPrice: (storeId) => {
                const items = storeId ? get().items.filter(item => item.storeId === storeId) : get().items;
                return items.reduce((total, item) => total + item.price * item.quantity, 0);
            },
        }),
        {
            name: 'cart-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
