import { Product } from "@/types";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
    products: Product[];
    template?: "modern" | "minimal" | "bold";
}

export function ProductGrid({ products, template = "modern" }: ProductGridProps) {
    // Luxury grid: 2 columns on mobile (standard), 3 on tablet, 4 on laptop, 5 on ultra-wide
    // User requested "mobile grid of 3" but that is often too small for touch targets. 
    // We will use grid-cols-2 for mobile as a safe "native" feel, and grid-cols-5 for desktop.
    // If the template is 'bold', we might want bigger cards, but let's stick to the request.

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} template={template} />
            ))}
        </div>
    );
}
