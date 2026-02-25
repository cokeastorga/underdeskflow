"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Product, ProductVariant } from "@/types";
import { useCart } from "@/store/useCart";
import { ShoppingCart, Check } from "lucide-react";
import { toast } from "sonner";
import { SizeGuideModal } from "./SizeGuideModal";
import { formatPrice } from "@/lib/utils/currency";

interface VariantSelectorProps {
    product: Product;
    storeId: string;
}

export function ProductVariantSelector({ product, storeId }: VariantSelectorProps) {
    const addItem = useCart((state) => state.addItem);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

    // Initialize defaults
    useEffect(() => {
        if (product.hasVariants && product.options && product.options.length > 0) {
            const defaults: Record<string, string> = {};
            product.options.forEach(opt => {
                defaults[opt.name] = opt.values[0];
            });
            setSelectedOptions(defaults);
        }
    }, [product]);

    // Update selected variant when options change
    useEffect(() => {
        if (!product.hasVariants || !product.variants) return;

        const variant = product.variants.find(v => {
            return Object.entries(v.options).every(([key, val]) => selectedOptions[key] === val);
        });

        setSelectedVariant(variant || null);
    }, [selectedOptions, product]);

    const handleOptionChange = (optionName: string, value: string) => {
        setSelectedOptions(prev => ({ ...prev, [optionName]: value }));
    };

    const handleAddToCart = () => {
        // If variants enabled but no variant found (shouldn't happen with valid data)
        if (product.hasVariants && !selectedVariant) {
            toast.error("Please select all options");
            return;
        }

        const itemToAdd = {
            ...product,
            id: product.id, // Ensure ID matches
            price: selectedVariant ? selectedVariant.price : product.price,
            // If variant has specific image, we could use it via overrides but cart usually uses main image
            // We can pass variantId to cart
            selectedVariantId: selectedVariant?.id,
            selectedOptions: selectedOptions
        };

        // Cart Logic needs to check if it supports variants. 
        // Based on useCart signature it takes `product`. 
        // We might need to extend useCart to support variants or just add it as is.
        // For now, let's assume simple add.

        addItem(itemToAdd, storeId);
        toast.success(`¡${product.name} añadido al carrito!`);
    };

    const currentPrice = selectedVariant ? selectedVariant.price : product.price;
    const isOutOfStock = selectedVariant ? selectedVariant.stock <= 0 && selectedVariant.status === 'out_of_stock' : product.stock! <= 0;

    return (
        <div className="space-y-6">
            <div className="text-3xl font-black tracking-tight text-primary">
                {formatPrice(currentPrice)}
            </div>

            {product.hasVariants && product.options?.map((option) => (
                <div key={option.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                            {option.name}: <span className="text-foreground">{selectedOptions[option.name]}</span>
                        </label>
                        {/* Show Size Guide only for 'Size' or 'Talla' options */}
                        {['size', 'talla', 'tallas'].some(t => option.name.toLowerCase().includes(t)) && (
                            <SizeGuideModal category={product.category} />
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {option.values.map((val) => {
                            const isSelected = selectedOptions[option.name] === val;
                            return (
                                <button
                                    key={val}
                                    onClick={() => handleOptionChange(option.name, val)}
                                    className={cn(
                                        "min-w-[3rem] px-4 py-2 rounded-md border text-sm font-medium transition-all",
                                        isSelected
                                            ? "border-primary bg-primary text-primary-foreground ring-offset-2 ring-1 ring-primary"
                                            : "border-input bg-transparent hover:bg-accent hover:text-accent-foreground"
                                    )}
                                >
                                    {val}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            <div className="pt-4">
                <Button
                    size="lg"
                    className="w-full h-16 rounded-2xl text-lg font-bold gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all group"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                >
                    {isOutOfStock ? (
                        "Agotado"
                    ) : (
                        <>
                            <ShoppingCart className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            Añadir al Carrito
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
