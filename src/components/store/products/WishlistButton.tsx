"use client";

import { Button } from "@/components/ui/button";
import { useWishlist } from "@/store/useWishlist";
import { Product } from "@/types";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface WishlistButtonProps {
    product: Product;
    className?: string;
    variant?: "icon" | "full";
}

export function WishlistButton({ product, className, variant = "icon" }: WishlistButtonProps) {
    const { isInWishlist, addItem, removeItem } = useWishlist();
    const [mounted, setMounted] = useState(false);
    const inWishlist = isInWishlist(product.id);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleWishlist = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (inWishlist) {
            removeItem(product.id);
        } else {
            addItem(product);
        }
    };

    if (!mounted) {
        return variant === "icon" ? (
            <Button size="icon" variant="ghost" className={className} disabled>
                <Heart className="w-5 h-5" />
            </Button>
        ) : null;
    }

    if (variant === "full") {
        return (
            <Button
                variant="outline"
                size="lg"
                className={cn("gap-2 w-full sm:w-auto h-12 text-base", className)}
                onClick={toggleWishlist}
            >
                <Heart className={cn("w-5 h-5", inWishlist ? "fill-red-500 text-red-500" : "")} />
                {inWishlist ? "Saved" : "Save to Wishlist"}
            </Button>
        );
    }

    return (
        <Button
            size="icon"
            variant="ghost"
            onClick={toggleWishlist}
            className={cn("hover:bg-red-50 hover:text-red-600 transition-colors rounded-full", className)}
        >
            <Heart className={cn("w-5 h-5 transition-colors", inWishlist ? "fill-red-500 text-red-500" : "")} />
        </Button>
    );
}
