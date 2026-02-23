"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/store/useCart";
import { Product } from "@/types";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface AddToCartButtonProps {
    product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
    const addItem = useCart((state) => state.addItem);

    const handleAddToCart = () => {
        addItem(product);
        toast.success("Added to cart!");
    };

    return (
        <Button size="lg" className="w-full sm:w-auto text-lg h-12 gap-2" onClick={handleAddToCart}>
            <ShoppingCart className="mr-2 h-5 w-5" />
            Add to Cart
        </Button>
    );
}
