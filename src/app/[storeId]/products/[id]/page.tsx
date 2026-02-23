import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import { db } from "@/lib/firebase/config";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { Product } from "@/types";
import { Store } from "@/types/store";
import { ArrowLeft, Star, Truck, RefreshCcw, ShieldCheck, Info } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/store/products/AddToCartButton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FadeIn } from "@/components/ui/fade-in";
import { ProductGrid } from "@/components/store/products/ProductGrid";
import { ProductGallery } from "@/components/store/products/ProductGallery";
import { ProductVariantSelector } from "@/components/store/products/ProductVariantSelector";

import { ReviewsSection } from "@/components/store/reviews/ReviewsSection";

// ... existing code


interface ProductPageProps {
    params: Promise<{
        storeId: string;
        id: string;
    }>;
}

// ... helper functions (getStoreConfig, getProduct) remain the same

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    const { storeId, id } = await params;
    const product = await getProduct(id);
    const store = await getStoreConfig(storeId);

    if (!product || !store) {
        return {
            title: "Product Not Found",
        };
    }

    const mainImage = product.image || "";
    const images = product.media?.map(m => m.url) || (product.image ? [product.image] : []);

    return {
        title: `${product.name} | ${store.name}`,
        description: product.description?.substring(0, 160) || `Buy ${product.name} at ${store.name}`,
        openGraph: {
            title: product.name,
            description: product.description?.substring(0, 160),
            url: `https://${store.id}.tu-dominio.com/products/${product.id}`, // Placeholder domain logic
            siteName: store.name,
            images: images.map(url => ({
                url,
                width: 800,
                height: 600,
                alt: product.name,
            })),
            locale: 'es_ES',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: product.name,
            description: product.description?.substring(0, 160),
            images: [mainImage],
        },
    };
}

async function getStoreConfig(storeId: string) {
    try {
        const docRef = doc(db, "stores", storeId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as Store;
        }
        return null;
    } catch (error) {
        console.error("Failed to fetch store config:", error);
        return null;
    }
}

async function getProduct(id: string) {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Product;
    }
    return null;
}

async function getRelatedProducts(storeId: string, category: string, currentId: string) {
    try {
        const q = query(
            collection(db, "products"),
            where("storeId", "==", storeId),
            where("category", "==", category),
            limit(5)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as Product))
            .filter((p) => p.id !== currentId)
            .slice(0, 4);
    } catch (error) {
        console.error("Failed to fetch related products:", error);
        return [];
    }
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { storeId, id } = await params;
    const storeConfig = await getStoreConfig(storeId);
    const product = await getProduct(id);

    if (!product) {
        notFound();
    }

    const relatedProducts = await getRelatedProducts(storeId, product.category, product.id);
    const currentTemplate = storeConfig?.design?.template || "modern";
    const headingFont = storeConfig?.design?.typography?.headingFont;
    const bodyFont = storeConfig?.design?.typography?.bodyFont;

    // Schema.org Structured Data (Product)
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        image: product.image,
        description: product.description,
        brand: {
            "@type": "Brand",
            name: product.brand || storeConfig?.name || "Generic"
        },
        sku: product.id,
        offers: {
            "@type": "Offer",
            url: `https://${storeConfig?.id}.tu-dominio.com/products/${product.id}`,
            priceCurrency: "USD",
            price: product.price,
            availability: (product.stock && product.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition"
        }
    };

    return (
        <div className="min-h-screen bg-background" style={{ fontFamily: bodyFont }}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* Breadcrumb / Back Navigation */}
            <div className="container py-8">
                <Link href={`/${storeId}/products`} className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
                    <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to Collection
                </Link>
            </div>

            <main className="container pb-24">
                <div className="lg:grid lg:grid-cols-2 lg:gap-x-16 xl:gap-x-24">
                    {/* Left Column: Gallery */}
                    <FadeIn duration={800} direction="up" className="mb-10 lg:mb-0">
                        <ProductGallery product={product} />
                    </FadeIn>

                    {/* Right Column: Key Details */}
                    <div className="flex flex-col space-y-8 lg:max-w-xl lg:py-8 lg:sticky lg:top-24 self-start">
                        <FadeIn duration={800} delay={200} direction="up">
                            {/* Header */}
                            <div className="space-y-4 border-b pb-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                                        {product.brand && <span className="text-foreground">{product.brand}</span>}
                                        {product.brand && <span>•</span>}
                                        <span>{product.category}</span>
                                    </div>
                                    {product.rating && (
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 fill-primary text-primary" />
                                            <span className="text-sm font-medium">{product.rating}</span>
                                        </div>
                                    )}
                                </div>
                                <h1 className={`text-4xl lg:text-5xl font-bold tracking-tight text-foreground ${currentTemplate === 'bold' ? 'uppercase font-black' : (currentTemplate === 'minimal' ? 'font-light' : 'font-serif')}`} style={{ fontFamily: headingFont }}>
                                    {product.name}
                                </h1>
                                {product.model && (
                                    <p className="text-lg text-muted-foreground">Model: {product.model}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="py-6 text-base text-muted-foreground leading-relaxed">
                                <p>{product.description}</p>
                            </div>

                            {/* Variant Selector & Add to Cart */}
                            <div className="space-y-6 pb-8 border-b">
                                <ProductVariantSelector product={product} />

                                <div className="flex items-center justify-center gap-6 text-xs uppercase tracking-widest text-muted-foreground pt-4">
                                    <div className="flex items-center gap-2">
                                        <Truck className="w-4 h-4" /> Free Shipping
                                    </div>
                                    {product.warranty && (
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="w-4 h-4" /> {product.warranty} Warranty
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Accordions */}
                            <div className="pt-4">
                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="details">
                                        <AccordionTrigger className="uppercase text-sm tracking-widest font-semibold">Technical Specifications</AccordionTrigger>
                                        <AccordionContent>
                                            <dl className="space-y-2 text-sm">
                                                {product.origin && (
                                                    <div className="flex justify-between py-1 border-b border-dashed">
                                                        <dt className="text-muted-foreground">Origin</dt>
                                                        <dd className="font-medium">{product.origin}</dd>
                                                    </div>
                                                )}
                                                {product.weight && product.weight > 0 && (
                                                    <div className="flex justify-between py-1 border-b border-dashed">
                                                        <dt className="text-muted-foreground">Weight</dt>
                                                        <dd className="font-medium">{product.weight} kg</dd>
                                                    </div>
                                                )}
                                                {product.dimensions && (product.dimensions.length > 0 || product.dimensions.width > 0) && (
                                                    <div className="flex justify-between py-1 border-b border-dashed">
                                                        <dt className="text-muted-foreground">Dimensions</dt>
                                                        <dd className="font-medium">
                                                            {product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} cm
                                                        </dd>
                                                    </div>
                                                )}
                                                {product.technicalSpecs?.map((spec, idx) => (
                                                    <div key={idx} className="flex justify-between py-1 border-b border-dashed">
                                                        <dt className="text-muted-foreground">{spec.label}</dt>
                                                        <dd className="font-medium">{spec.value}</dd>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between py-1 pt-4">
                                                    <dt className="text-muted-foreground">SKU</dt>
                                                    <dd className="font-mono text-xs">{product.id.substring(0, 8).toUpperCase()}</dd>
                                                </div>
                                            </dl>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {product.careInstructions && (
                                        <AccordionItem value="care">
                                            <AccordionTrigger className="uppercase text-sm tracking-widest font-semibold">Care Instructions</AccordionTrigger>
                                            <AccordionContent>
                                                <div className="flex gap-4 items-start text-muted-foreground">
                                                    <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                                    <p>{product.careInstructions}</p>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )}

                                    <AccordionItem value="shipping">
                                        <AccordionTrigger className="uppercase text-sm tracking-widest font-semibold">Shipping & Returns</AccordionTrigger>
                                        <AccordionContent>
                                            <p className="text-muted-foreground">
                                                We offer free standard shipping on all orders. Returns are accepted within 30 days of purchase.
                                            </p>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </main>

            {/* Related Products Section */}
            {relatedProducts.length > 0 && (
                <section className="bg-gray-50 py-24">
                    <div className="container">
                        <FadeIn duration={1000} className="space-y-12">
                            <div className="text-center space-y-4">
                                <h2 className={`text-3xl font-bold ${currentTemplate === 'bold' ? 'uppercase font-black' : 'font-serif'}`} style={{ fontFamily: headingFont }}>
                                    You May Also Like
                                </h2>
                                <div className="w-24 h-1 bg-primary mx-auto" />
                            </div>
                            <ProductGrid products={relatedProducts} template={currentTemplate} />
                        </FadeIn>
                    </div>
                </section>
            )}

            {/* Reviews Section */}
            <div className="container pb-24">
                <ReviewsSection storeId={storeId} productId={product.id} productName={product.name} />
            </div>
        </div>
    );
}
