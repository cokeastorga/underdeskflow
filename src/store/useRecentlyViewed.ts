import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Product } from '@/types';

interface RecentlyViewedState {
    items: Product[];
    addProduct: (product: Product) => void;
}

export const useRecentlyViewed = create<RecentlyViewedState>()(
    persist(
        (set, get) => ({
            items: [],
            addProduct: (product) => {
                const currentItems = get().items;
                // Remove if exists to move to top
                const filtered = currentItems.filter(item => item.id !== product.id);
                // Keep only last 10
                set({ items: [product, ...filtered].slice(0, 10) });
            },
        }),
        {
            name: 'recently-viewed-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
