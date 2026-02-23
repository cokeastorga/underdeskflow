import { ProductGrid } from "@/components/store/products/ProductGrid";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { Product } from "@/types";
import { ProductFilters } from "@/components/store/ProductFilters";
import { PromoBanner } from "@/components/store/PromoBanner";

interface Props {
    params: { storeId: string };
    searchParams: {
        category?: string;
        sort?: string;
        minPrice?: string;
        maxPrice?: string;
        size?: string;
    };
}

async function getProducts(storeId: string, searchParams: Props['searchParams']) {
    try {
        const { category, minPrice, maxPrice, size } = searchParams;

        let q = query(
            collection(db, "products"),
            where("storeId", "==", storeId),
            orderBy("createdAt", "desc")
        );

        if (category) {
            // Note: In a real app, you'd likely want a composite index or filter in memory if the dataset is small.
            // Firestore simple queries don't support multiple inequalities well, but equality is fine.
            // However, 'category' field must exist on products.
            q = query(
                collection(db, "products"),
                where("storeId", "==", storeId),
                where("category", "==", category),
                orderBy("createdAt", "desc")
            );
        }

        const querySnapshot = await getDocs(q);
        let products = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Product[];

        // In-memory filtering for other attributes to avoid complex firestore indexes for every tenant
        if (minPrice || maxPrice || size) {
            products = products.filter(product => {
                // Price Filter
                let price = product.price;
                // If product has variants, use the lowest price
                if (product.hasVariants && product.variants?.length) {
                    price = Math.min(...product.variants.map(v => v.price));
                }

                if (minPrice && price < Number(minPrice)) return false;
                if (maxPrice && price > Number(maxPrice)) return false;

                // Size Filter
                if (size) {
                    const hasSize = product.size === size ||
                        product.variants?.some(v => v.options?.size === size || v.title.includes(size));
                    if (!hasSize) return false;
                }

                return true;
            });
        }

        return products;
    } catch (error) {
        console.error("Failed to fetch products:", error);
        return [];
    }
}

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ProductsPage({ params, searchParams }: Props) {
    const products = await getProducts(params.storeId, searchParams);
    const { category } = searchParams;

    return (
        <div className="container py-8 md:py-12">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar Filters */}
                <ProductFilters storeId={params.storeId} />

                {/* Main Content */}
                <div className="flex-1">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl font-serif">
                            {category ? `Categoría: ${category}` : "Todos los Productos"}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Mostrando {products.length} resultados
                        </p>
                    </div>

                    {products.length > 0 ? (
                        <ProductGrid products={products} />
                    ) : (
                        <div className="py-12 text-center border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">No se encontraron productos con estos filtros.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-16">
                <PromoBanner
                    title="¿No encuentras lo que buscas?"
                    subtitle="Suscríbete para recibir notificaciones cuando lleguen nuevos productos."
                    cta="Suscribirse"
                    link="#"
                    color="bg-zinc-800"
                />
            </div>
        </div>
    );
}
