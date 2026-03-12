import { adminDb } from "@/lib/firebase/admin-config";
import { Product, Variant, Category } from "@/domains/catalog/types";

// Public Storefront Main Page
// Served automatically via Next.js Middleware Rewrite for Custom Domains
// URL shape internally: /storefront/[storeId]

export default async function StorefrontPage({ params }: { params: { storeId: string } }) {
    // 1. Fetch Store Config
    const storeSnap = await adminDb.collection("stores").doc(params.storeId).get();
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

    // 2. Fetch Catalog (Categories + Products + Variants wrapper or simple fetch for demo)
    const prodsSnap = await adminDb.collection("products").where("storeId", "==", params.storeId).where("isActive", "==", true).limit(50).get();
    const products = prodsSnap.docs.map(d => d.data() as Product);

    // Basic Server Rendered UI
    return (
        <div className="min-h-screen bg-white">
            <header className="border-b bg-white top-0 sticky z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="font-bold text-xl tracking-tight">{storeData.name || "Mi Tienda"}</div>
                    
                    {/* Simplified Cart Button */}
                    <button className="flex items-center gap-2 bg-slate-950 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition">
                        <span>🛒 Carrito (0)</span>
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="mb-12 text-center space-y-4">
                     <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">Nuestros Productos</h1>
                     <p className="text-lg text-slate-500 max-w-2xl mx-auto">Explora nuestro catálogo completo.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-slate-400">
                            No hay productos disponibles por el momento.
                        </div>
                    ) : (
                        products.map(product => (
                            <div key={product.id} className="group cursor-pointer">
                                <div className="aspect-square w-full rounded-2xl bg-slate-100 mb-4 overflow-hidden border border-slate-200">
                                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 group-hover:scale-105 transition duration-500">
                                        [Imagen]
                                    </div>
                                </div>
                                <h3 className="font-semibold text-slate-900 line-clamp-1">{product.name}</h3>
                                {/* Usually we'd resolve pricing dynamically via rules here / or base variant */}
                                <p className="text-slate-500 text-sm mt-1 line-clamp-2">{product.description || "Sin descripción"}</p>
                                
                                <button className="mt-4 w-full bg-slate-100 text-slate-900 font-medium py-2 rounded-xl text-sm hover:bg-slate-200 transition">
                                    Ver opciones
                                </button>
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
