"use client";

import { useRecentlyViewed } from "@/store/useRecentlyViewed";
import { Product } from "@/types";
import { useEffect, useState } from "react";
import { ProductGrid } from "@/components/store/products/ProductGrid";
import { FadeIn } from "@/components/ui/fade-in";

export function RecentlyViewedTracker({ product }: { product: Product }) {
    const addProduct = useRecentlyViewed(state => state.addProduct);

    useEffect(() => {
        if (product) {
            addProduct(product);
        }
    }, [product, addProduct]);

    return null; // Headless component just for logic
}

export function RecentlyViewedSection({ currentProductId }: { currentProductId: string }) {
    const items = useRecentlyViewed(state => state.items);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const filteredItems = items.filter(p => p.id !== currentProductId).slice(0, 4);

    if (filteredItems.length === 0) return null;

    return (
        <section className="bg-white py-12 border-t">
            <div className="container">
                <FadeIn>
                    <h3 className="text-2xl font-bold mb-8 font-serif">Recently Viewed</h3>
                    <ProductGrid products={filteredItems} template="minimal" />
                </FadeIn>
            </div>
        </section>
    );
}
