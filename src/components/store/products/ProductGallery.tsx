"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Product } from "@/types";

interface ProductGalleryProps {
    product: Product;
}

export function ProductGallery({ product }: ProductGalleryProps) {
    const images = product.media && product.media.length > 0
        ? product.media.sort((a, b) => a.order - b.order).map(m => m.url)
        : product.image ? [product.image] : [];

    // Also include images from 'images' array if media is empty but images exists (legacy/bulk import)
    if (images.length === 0 && product.images && product.images.length > 0) {
        images.push(...product.images);
    }

    const [selectedImage, setSelectedImage] = useState(images[0]);

    if (images.length === 0) {
        return (
            <div className="aspect-[4/5] w-full bg-secondary flex items-center justify-center text-muted-foreground rounded-lg">
                No Image
            </div>
        );
    }

    return (
        <div className="flex flex-col-reverse lg:flex-row gap-4">
            {/* Thumbnails (Left side on Desktop, Bottom on Mobile) */}
            {images.length > 1 && (
                <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto lg:h-[600px] scrollbar-hide">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedImage(img)}
                            className={cn(
                                "relative flex-shrink-0 w-20 h-24 rounded-md overflow-hidden border-2 transition-all",
                                selectedImage === img ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                            )}
                        >
                            <Image
                                src={img}
                                alt={`${product.name} view ${idx + 1}`}
                                fill
                                className="object-cover"
                                sizes="80px"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Main Image */}
            <div className="relative flex-1 aspect-[4/5] rounded-lg overflow-hidden bg-gray-100">
                <Image
                    src={selectedImage}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                />
            </div>
        </div>
    );
}
