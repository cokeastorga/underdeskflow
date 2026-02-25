import { ProductGrid } from "@/components/store/products/ProductGrid";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { Product } from "@/types";
import { ProductFilters } from "@/components/store/ProductFilters";
import { PromoBanner } from "@/components/store/PromoBanner";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Props {
    params: Promise<{ storeId: string }>;
    searchParams: Promise<{
        category?: string;
        sort?: string;
        minPrice?: string;
        maxPrice?: string;
        size?: string;
    }>;
}

async function getProducts(storeId: string, searchParams: any) {
    try {
        const category = searchParams.category;
        const minPrice = searchParams.minPrice;
        const maxPrice = searchParams.maxPrice;
        const size = searchParams.size;

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
    const { storeId } = await params;
    const resolvedSearchParams = await searchParams;
    const products = await getProducts(storeId, resolvedSearchParams);
    const { category } = resolvedSearchParams;

    return (
        <div className="bg-white dark:bg-black min-h-screen">
            {/* Minimal Header */}
            <div className="relative h-[30vh] md:h-[40vh] flex items-center justify-center overflow-hidden bg-zinc-900">
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent z-10" />
                    <img
                        src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop"
                        alt="Collection"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="relative z-20 text-center space-y-4 px-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <p className="text-white/60 text-xs font-bold uppercase tracking-[0.4em]">Explora</p>
                    <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-white font-serif italic">
                        {category ? category : "Nuestra Colección"}
                    </h1>
                    <div className="w-16 h-1 bg-primary mx-auto" />
                    <div className="flex items-center justify-center gap-3 text-white/40 text-[10px] font-bold uppercase tracking-widest pt-2">
                        <span>Lujo</span>
                        <span className="h-1 w-1 bg-white/20 rounded-full" />
                        <span>Calidad</span>
                        <span className="h-1 w-1 bg-white/20 rounded-full" />
                        <span>Exclusividad</span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12">
                    {/* Sidebar Filters - 3 Cols */}
                    <div className="lg:col-span-3">
                        <ProductFilters storeId={storeId} />
                    </div>

                    {/* Main Content - 9 Cols */}
                    <div className="lg:col-span-9 space-y-12">
                        <div className="flex flex-col md:flex-row items-center justify-between border-b pb-6 gap-4">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                                    Filtrado por: <span className="text-foreground">{category || 'Todo'}</span>
                                </span>
                            </div>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest bg-zinc-50 px-3 py-1.5 rounded-full border">
                                {products.length} {products.length === 1 ? 'Obra' : 'Obras'} Maestras
                            </p>
                        </div>

                        {products.length > 0 ? (
                            <ProductGrid products={products} storeId={storeId} />
                        ) : (
                            <div className="py-32 text-center border-2 border-dashed rounded-3xl bg-zinc-50/50">
                                <p className="text-muted-foreground font-serif italic text-xl">
                                    Buscamos la perfección. No encontramos resultados para estos filtros.
                                </p>
                                <Link href={`/${storeId}/products`}>
                                    <Button variant="link" className="mt-4 text-primary">
                                        Ver toda la colección
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-24 mb-32 border-t pt-24 px-4">
                <PromoBanner
                    title="¿Buscas algo aún más exclusivo?"
                    subtitle="Suscríbete para recibir notificaciones cuando lleguen nuevas piezas de colección."
                    cta="Suscribirse al Club"
                    link="#"
                    color="bg-black"
                />
            </div>
        </div>
    );
}
