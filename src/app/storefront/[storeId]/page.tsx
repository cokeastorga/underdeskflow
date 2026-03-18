import { adminDb } from "@/lib/firebase/admin-config";
import { Product, Variant, Category } from "@/domains/catalog/types";

// Public Storefront Main Page
// Served automatically via Next.js Middleware Rewrite for Custom Domains
// URL shape internally: /storefront/[storeId]

export default async function StorefrontPage({ params }: { params: Promise<{ storeId: string }> }) {
    const { storeId } = await params;
    // 1. Fetch Store Config
    const storeSnap = await adminDb.collection("stores").doc(storeId).get();
    if (!storeSnap.exists) {
        return (
            <div className="flex h-screen items-center justify-center p-8 bg-slate-50">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold text-slate-900">Tienda no encontrada</h1>
                    <p className="text-slate-600">Verifica que el dominio esté correctamente enlazado.</p>
                </div>
            </div>
        );
    }
    const storeData = storeSnap.data()!;

    // 2. Fetch Catalog (Categories + Products)
    const prodsSnap = await adminDb.collection("products").where("storeId", "==", storeId).where("isActive", "==", true).limit(50).get();
    const rawProducts = prodsSnap.docs.map(d => ({id: d.id, ...d.data()} as Product));

    // 3. Fetch Base Variants for Pricing
    const productIds = rawProducts.map(p => p.id);
    let allVariants: Variant[] = [];
    
    if (productIds.length > 0) {
        // Chunk to 30 for Firestore 'in' limits
        const chunks = [];
        for (let i = 0; i < productIds.length; i += 30) {
             chunks.push(productIds.slice(i, i + 30));
        }

        for (const chunk of chunks) {
             const vSnap = await adminDb.collection("variants").where("productId", "in", chunk).where("isActive", "==", true).get();
             allVariants = [...allVariants, ...vSnap.docs.map(d => ({id: d.id, ...d.data()} as Variant))];
        }
    }
    
    // Hydrate Products
    const products = rawProducts.map(p => {
        const myVariants = allVariants.filter(v => v.productId === p.id);
        const baseVariant = myVariants[0];
        
        return {
             ...p,
             basePrice: baseVariant?.basePrice || 0,
             minPrice: Math.min(...myVariants.map(v => v.basePrice || Infinity)),
             hasVariants: myVariants.length > 1
        };
    });

    const fmtAmount = (amount: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(amount);

    // Basic Server Rendered UI
    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-primary/20">
            <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="font-extrabold text-2xl tracking-tight text-slate-900">{storeData.name || "Mi Tienda"}</div>
                    
                    {/* Simplified Cart Button */}
                    <button className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm active:scale-95">
                        <span>🛒 <span className="hidden sm:inline">Carrito</span> (0)</span>
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="mb-16 text-center space-y-4">
                     <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900">Nuestro <span className="text-primary">Catálogo</span></h1>
                     <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium">Equípate con lo mejor.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                    {products.length === 0 ? (
                        <div className="col-span-full py-32 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                             <div className="text-5xl mb-4 opacity-50">📦</div>
                             <h3 className="text-xl font-bold text-slate-900 mb-2">Próximamente</h3>
                             <p className="text-slate-500">Estamos preparando nuestros mejores productos.</p>
                        </div>
                    ) : (
                        products.map((product: any) => (
                            <div key={product.id} className="group flex flex-col cursor-pointer bg-white rounded-2xl border border-slate-100/50 hover:border-primary/20 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden">
                                <div className="aspect-[4/3] w-full bg-slate-50 relative overflow-hidden">
                                     <div className="absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent z-10" />
                                     <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 group-hover:scale-105 transition-transform duration-700 ease-out">
                                        <svg className="w-12 h-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                     </div>
                                </div>
                                
                                <div className="p-5 flex flex-col flex-1">
                                     {product?.brand && <span className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">{product.brand}</span>}
                                     <h3 className="font-bold text-lg text-slate-900 line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
                                     <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-1">{product.description || ""}</p>
                                     
                                     <div className="flex items-end justify-between mt-auto pt-4 border-t border-slate-100">
                                         <div>
                                            {product.hasVariants && <p className="text-xs text-slate-400 font-medium mb-0.5">Desde</p>}
                                            <p className="text-xl font-black text-slate-900">{fmtAmount(product.minPrice !== Infinity ? product.minPrice : product.basePrice)}</p>
                                         </div>
                                         <button className="bg-slate-100 text-slate-900 font-bold px-4 py-2 rounded-xl text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                             {product.hasVariants ? 'Opciones' : 'Agregar'}
                                         </button>
                                     </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
            
            <footer className="border-t bg-slate-50 mt-20">
                 <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">
                     &copy; {new Date().getFullYear()} {storeData.name}. Todos los derechos reservados.
                     <p className="mt-2 text-xs">Powered by UnderDesk Flow</p>
                 </div>
            </footer>
        </div>
    );
}
