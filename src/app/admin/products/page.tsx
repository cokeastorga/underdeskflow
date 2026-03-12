import { getProducts } from "@/domains/catalog/services.server";
import { PackagePlus, Search } from "lucide-react";
import Link from "next/link";

// Using a hardcoded storeId for demonstration (e.g. Delicias Porteñas).
// In Production: const storeId = await getTenantIdFromSession();
const STORE_ID = "store_1";

export default async function AdminProductsPage() {
    const products = await getProducts(STORE_ID);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Catálogo de Productos</h1>
                    <p className="text-muted-foreground">Gestiona tus productos, categorías y variantes.</p>
                </div>
                
                <Link 
                    href="/admin/products/new" 
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                >
                    <PackagePlus className="mr-2 h-4 w-4" />
                    Nuevo Producto
                </Link>
            </div>
            
            <div className="border border-border rounded-xl bg-card overflow-hidden">
                <div className="p-4 border-b border-border flex gap-4 items-center">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input 
                            type="search" 
                            placeholder="Buscar productos..." 
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9"
                        />
                    </div>
                </div>
                
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Nombre / SKU</th>
                                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Estado</th>
                                <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Variantes</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-muted-foreground">
                                        No hay productos registrados. Crea el primero.
                                    </td>
                                </tr>
                            ) : (
                                products.map((prod) => (
                                    <tr key={prod.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 align-middle">
                                            <Link href={`/admin/products/${prod.id}`} className="font-medium hover:underline">
                                                {prod.name}
                                            </Link>
                                            <div className="text-xs text-muted-foreground mt-1">ID: {prod.id}</div>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${prod.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'}`}>
                                                {prod.isActive ? "Activo" : "Inactivo"}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle text-right">
                                            {/* We can fetch and aggregate variant count later */}
                                            <span className="text-muted-foreground">Ver variantes</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
