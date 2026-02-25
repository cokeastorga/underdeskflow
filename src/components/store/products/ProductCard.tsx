"use client"

import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/store/useCart";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { WishlistButton } from "./WishlistButton";
import { formatPrice } from "@/lib/utils/currency";

// ... imports

interface ProductCardProps {
    product: Product;
    storeId: string;
    template?: "modern" | "minimal" | "bold";
}

export function ProductCard({ product, storeId, template = "modern" }: ProductCardProps) {
    const addItem = useCart((state) => state.addItem);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        addItem(product, storeId);
        toast.success(`¡${product.name} añadido al carrito!`);
    };

    // Luxury & Standard Templates
    if (template === "minimal") {
        return (
            <div className="group relative flex flex-col bg-transparent">
                <Link href={`/${storeId}/products/${product.id}`} className="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-4">
                    {product.image ? (
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-300">
                            No Image
                        </div>
                    )}

                    {/* Minimal Quick Actions */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center">
                        <Button onClick={handleAddToCart} variant="secondary" className="bg-white/90 backdrop-blur-sm text-black hover:bg-black hover:text-white rounded-none w-full text-xs uppercase tracking-widest font-bold">
                            Quick Add
                        </Button>
                    </div>

                    {product.isNew && (
                        <div className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest text-black/70">
                            New Arrival
                        </div>
                    )}
                </Link>

                <div className="flex flex-col items-center text-center space-y-1">
                    <h3 className="text-sm font-medium tracking-wide uppercase text-gray-900 group-hover:text-black transition-colors">
                        <Link href={`/${storeId}/products/${product.id}`}>{product.name}</Link>
                    </h3>
                    <p className="text-xs text-muted-foreground tracking-wider">{product.category}</p>
                    <p className="text-sm font-light text-gray-900">
                        {formatPrice(product.price)}
                    </p>
                </div>
            </div>
        );
    }

    if (template === "bold") {
        return (
            <div className="group relative flex flex-col border-4 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200">
                <Link href={`/${storeId}/products/${product.id}`} className="relative aspect-square overflow-hidden border-b-4 border-black bg-yellow-300">
                    {product.image && (
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover mix-blend-multiply filter grayscale group-hover:grayscale-0 transition-all duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    )}
                    {!product.image && (
                        <div className="flex h-full w-full items-center justify-center font-black text-2xl uppercase opacity-20 transform rotate-45">
                            No Image
                        </div>
                    )}

                    {product.isNew && (
                        <div className="absolute top-0 right-0 bg-black text-white px-3 py-1 text-sm font-black uppercase border-l-4 border-b-4 border-black">
                            Fresh
                        </div>
                    )}
                </Link>

                <div className="p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="font-black text-xl md:text-2xl uppercase leading-none tracking-tighter break-words">
                            <Link href={`/${storeId}/products/${product.id}`}>{product.name}</Link>
                        </h3>
                    </div>

                    <div className="flex items-end justify-between mt-2">
                        <div className="text-xl font-black bg-white px-1">
                            {formatPrice(product.price)}
                        </div>
                        <Button onClick={handleAddToCart} className="rounded-none border-2 border-black bg-black text-white hover:bg-white hover:text-black font-bold uppercase tracking-tight text-xs h-10 px-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all">
                            Add +
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Modern (Default) - Luxury Version
    return (
        <div className="group relative flex flex-col bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-1">
            {/* Image Overlay Actions */}
            <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <WishlistButton product={product} className="bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white" />
            </div>

            <Link href={`/${storeId}/products/${product.id}`} className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                {/* Image */}
                {product.image ? (
                    <>
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className={cn(
                                "object-cover transition-transform duration-700 ease-out group-hover:scale-110",
                                product.media && product.media.length > 1 ? "group-hover:opacity-0" : ""
                            )}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        {/* Secondary Hover Image */}
                        {product.media && product.media.length > 1 && (
                            <Image
                                src={product.media[1].url}
                                alt={product.name}
                                fill
                                className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out scale-110"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        )}
                    </>
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-50 text-muted-foreground text-sm">
                        Image Unavailable
                    </div>
                )}

                {/* Badges */}
                {product.isNew && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        New
                    </div>
                )}

                {/* Floating Action Button (Quick Add) */}
                <div className="absolute bottom-4 right-4 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out z-10">
                    <Button
                        size="icon"
                        onClick={handleAddToCart}
                        className="h-10 w-10 rounded-full bg-black text-white shadow-lg hover:scale-110 transition-transform"
                    >
                        <ShoppingCart className="h-4 w-4" />
                    </Button>
                </div>
            </Link>

            {/* Info */}
            <div className="p-5 flex flex-col items-center text-center space-y-2">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">{product.category}</p>
                <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-gray-100 leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem] w-full max-w-[200px]">
                    <Link href={`/${storeId}/products/${product.id}`}>{product.name}</Link>
                </h3>
                <span className="font-black text-base md:text-lg">
                    {formatPrice(product.price)}
                </span>
            </div>
        </div>
    );
}
