"use client";

import { Product } from "@/types";
import { ProductCard } from "./ProductCard";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/components/ui/motion-wrapper";

interface ProductGridProps {
    products: Product[];
    storeId: string;
    template?: "modern" | "minimal" | "bold";
    staggered?: boolean;
}

export function ProductGrid({ products, storeId, template = "modern", staggered = false }: ProductGridProps) {
    if (staggered) {
        return (
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12"
            >
                {products.map((product) => (
                    <motion.div key={product.id} variants={staggerItem}>
                        <ProductCard product={product} storeId={storeId} template={template} />
                    </motion.div>
                ))}
            </motion.div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} storeId={storeId} template={template} />
            ))}
        </div>
    );
}
