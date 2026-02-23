"use client";

import { useWishlist } from "@/store/useWishlist";
import { ProductGrid } from "@/components/store/products/ProductGrid";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/ui/fade-in";
import { useParams } from "next/navigation";

export default function WishlistPage() {
    const { items } = useWishlist();
    const params = useParams();
    const storeId = params.storeId as string;

    return (
        <div className="container py-12 min-h-[60vh]">
            <FadeIn>
                <div className="flex items-center justify-between mb-8 border-b pb-4">
                    <h1 className="text-3xl font-bold font-serif flex items-center gap-3">
                        <Heart className="w-8 h-8 fill-red-500 text-red-500" />
                        My Wishlist
                    </h1>
                    <span className="text-muted-foreground">{items.length} items</span>
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-24 space-y-6">
                        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
                            <Heart className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Your wishlist is empty</h2>
                            <p className="text-muted-foreground mt-2">Start saving your favorite items to build your collection.</p>
                        </div>
                        <Button asChild size="lg">
                            <Link href={`/${storeId}/products`}>Browse Collection</Link>
                        </Button>
                    </div>
                ) : (
                    <ProductGrid products={items} template="modern" />
                )}
            </FadeIn>
        </div>
    );
}
