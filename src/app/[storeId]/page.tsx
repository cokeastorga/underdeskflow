import { db } from "@/lib/firebase/config";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { Product } from "@/types";
import { Store } from "@/types/store";
import { HeroCarousel } from "@/components/store/HeroCarousel";
import { CategoryNav } from "@/components/store/CategoryNav";
import { PromoBanner } from "@/components/store/PromoBanner";
import { ProductGrid } from "@/components/store/products/ProductGrid";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MotionWrapper } from "@/components/ui/motion-wrapper";
import { Newsletter } from "@/components/store/Newsletter";
import { ArrowRight } from "lucide-react";

interface Props {
  params: Promise<{ storeId: string }>;
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

async function getFeaturedProducts(storeId: string) {
  try {
    const q = query(
      collection(db, "products"),
      where("storeId", "==", storeId),
      orderBy("price", "desc"), // Just as an example of "Featured"
      limit(4)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];
  } catch (error) {
    console.error("Failed to fetch featured products:", error);
    return [];
  }
}

async function getNewArrivals(storeId: string) {
  try {
    const q = query(
      collection(db, "products"),
      where("storeId", "==", storeId),
      orderBy("createdAt", "desc"),
      limit(4)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];
  } catch (error) {
    console.error("Failed to fetch new products:", error);
    return [];
  }
}

async function getCategories(storeId: string) {
  try {
    const q = query(
      collection(db, "categories"),
      where("storeId", "==", storeId),
      limit(6)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export const revalidate = 60;

export default async function StorePage({ params }: Props) {
  const resolvedParams = await params;
  const storeId = resolvedParams.storeId;
  const storeConfig = await getStoreConfig(storeId);
  const categories = await getCategories(storeId);
  const featuredProducts = await getFeaturedProducts(storeId);
  const newArrivals = await getNewArrivals(storeId);

  const sections = storeConfig?.design?.homeSections || [
    { id: "hero", type: "hero", enabled: true, order: 0 },
    { id: "featured", type: "featured-products", enabled: true, order: 1 },
    { id: "categories", type: "categories", enabled: true, order: 2 },
    { id: "newsletter", type: "newsletter", enabled: true, order: 4 },
  ];

  // Sort by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);
  const currentTemplate = storeConfig?.design?.template || "modern";

  const renderSection = (section: any) => {
    if (!section.enabled) return null;

    const SectionWrapper = ({ children, className = "", noContainer = false }: { children: React.ReactNode; className?: string; noContainer?: boolean }) => (
      <MotionWrapper className={`${noContainer ? "" : "container mx-auto px-4"} ${className}`}>
        {children}
      </MotionWrapper>
    );

    switch (section.type) {
      case "hero":
        return (
          <div key={section.id} className="w-full">
            <HeroCarousel storeId={storeId} slides={storeConfig?.design?.heroCarousel} template={currentTemplate} />
          </div>
        );

      case "categories":
        return (
          <SectionWrapper key={section.id}>
            <CategoryNav storeId={storeId} categories={categories} template={currentTemplate} />
          </SectionWrapper>
        );

      case "featured-products":
        return (
          <SectionWrapper key={section.id} className="py-24 bg-white" data-template={currentTemplate}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-16 text-center md:text-left">
              <div className="space-y-2">
                <h2 className={`text-4xl md:text-6xl font-bold ${currentTemplate === 'bold' ? 'uppercase font-black tracking-tighter' : (currentTemplate === 'minimal' ? 'font-light uppercase tracking-[0.2em]' : 'font-serif')}`} style={{ fontFamily: storeConfig?.design?.typography?.headingFont }}>
                  {section.title || "Selección Exclusiva"}
                </h2>
                <div className="h-1 w-20 bg-primary mx-auto md:mx-0 rounded-full" />
              </div>
              <Link href={`/${storeId}/products`} className={`group flex items-center gap-2 text-sm font-bold tracking-widest uppercase transition-all ${currentTemplate === 'bold' ? 'bg-black text-white px-8 py-4 hover:bg-primary hover:text-black' : 'hover:text-primary'}`}>
                Ver Todo <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            {featuredProducts.length > 0 ? (
              <ProductGrid products={featuredProducts} storeId={storeId} template={currentTemplate} staggered={true} />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                <p className="text-muted-foreground text-lg mb-6 max-w-sm">Nuestra nueva colección llegará pronto. Suscríbete para ser el primero en saber.</p>
                <Button variant="outline" className="rounded-full px-8">Explorar Categorías</Button>
              </div>
            )}
          </SectionWrapper>
        );

      case "benefits":
        return (
          <SectionWrapper key={section.id} className="py-24 border-y border-gray-100 bg-white">
            <div className="container">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* Luxury Benefit 1 */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-lg font-bold uppercase tracking-wide">Authenticity Guaranteed</h3>
                  <p className="text-muted-foreground font-light text-sm max-w-xs">Every item is verified by our experts to ensure 100% authenticity.</p>
                </div>
                {/* Luxury Benefit 2 */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h3 className="text-lg font-bold uppercase tracking-wide">Express Shipping</h3>
                  <p className="text-muted-foreground font-light text-sm max-w-xs">Complimentary express delivery on all orders over $200.</p>
                </div>
                {/* Luxury Benefit 3 */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  </div>
                  <h3 className="text-lg font-bold uppercase tracking-wide">Secure Payment</h3>
                  <p className="text-muted-foreground font-light text-sm max-w-xs">Your security is our priority. All transactions are encrypted.</p>
                </div>
              </div>
            </div>
          </SectionWrapper>
        );

      case "newsletter":
        return (
          <Newsletter
            key={section.id}
            title={section.title}
            template={currentTemplate}
            headingFont={storeConfig?.design?.typography?.headingFont}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden" style={{ fontFamily: storeConfig?.design?.typography?.bodyFont }}>
      {/* Dynamic Sections */}
      {sortedSections.map(section => renderSection(section))}
    </div>
  );
}
