"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/store/useCart";
import { Product } from "@/types";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface AddToCartButtonProps {
    product: Product;
    storeId: string;
}

export function AddToCartButton({ product, storeId }: AddToCartButtonProps) {
    const addItem = useCart((state) => state.addItem);

    const handleAddToCart = () => {
        addItem(product, storeId);
        toast.success(`¡${product.name} añadido al carrito!`);
    };

    return (
        <Button
            size="lg"
            className="w-full sm:w-auto text-lg h-14 rounded-2xl gap-3 font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group"
            onClick={handleAddToCart}
        >
            <ShoppingCart className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Añadir al Carrito
        </Button>
    );
}
