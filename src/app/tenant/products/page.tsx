"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc, query, orderBy, where, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { AdminProduct } from "@/types/admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, MoreHorizontal, Loader2, Package, Search, Copy, Trash2, Filter } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Image from "next/image";
import { useAuth } from "@/lib/firebase/auth-context";
import { ImportProductsDialog } from "@/components/tenant/products/ImportProductsDialog";

export default function AdminProductsPage() {
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const { storeId } = useAuth();

    const fetchProducts = async () => {
        if (!storeId) return;
        try {
            const q = query(
                collection(db, "products"),
                where("storeId", "==", storeId),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(q);
            const productsData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as AdminProduct[];
            setProducts(productsData);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar productos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (storeId) {
            fetchProducts();
        }
    }, [storeId]);

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) return;

        try {
            await deleteDoc(doc(db, "products", id));
            setProducts((prev) => prev.filter((p) => p.id !== id));
            toast.success("Producto eliminado.");
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar.");
        }
    };

    const handleDuplicate = async (product: AdminProduct) => {
        setLoading(true);
        try {
            // 1. Create copy of data
            const { id, ...rest } = product;
            const newProduct = {
                ...rest,
                storeId, // Ensure it belongs to current store
                name: `Copia de ${product.name || product.title}`,
                title: `Copia de ${product.title || product.name}`,
                slug: `${product.slug}-copy-${Date.now()}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: false,
                status: 'draft',
                images: product.images || [],
                media: product.media || []
            };

            // 2. Add to Firestore
            const docRef = await addDoc(collection(db, "products"), newProduct);

            // 3. Update local state
            setProducts(prev => [{ id: docRef.id, ...newProduct } as any, ...prev]);
            toast.success("Producto duplicado correctamente");
        } catch (error) {
            console.error("Error duplicating product:", error);
            toast.error("Error al duplicar el producto");
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const term = searchTerm.toLowerCase();
        const title = p.title || p.name || "";
        const matchesSearch = title.toLowerCase().includes(term);
        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "active" && (p.status === 'active' || p.isActive === true)) ||
            (statusFilter === "archived" && (p.status === 'archived' || (!p.isActive && p.status !== 'active')));

        return matchesSearch && matchesStatus;
    });

    const getProductImage = (product: AdminProduct) => {
        if (product.media && product.media.length > 0) {
            const primary = product.media.find(m => m.isPrimary) || product.media[0];
            return primary.url;
        }
        if (product.images && product.images.length > 0) return product.images[0];
        return product.image || null;
    };

    const getProductPrice = (product: AdminProduct) => {
        if (product.hasVariants && product.variants && product.variants.length > 0) {
            const minPrice = Math.min(...product.variants.map(v => v.price));
            return minPrice;
        }
        return product.price || 0;
    };

    const getProductStock = (product: AdminProduct) => {
        if (product.hasVariants && product.variants) {
            return product.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
        }
        return product.stock || 0;
    };

    if (loading && products.length === 0) return (
        <div className="space-y-4 p-4">
            <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
            <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
            <div className="space-y-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 w-full bg-muted animate-pulse rounded"></div>
                ))}
            </div>
        </div>
    );

    if (!products.length && !loading) {
        return (
            <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
                <div className="bg-primary/10 p-6 rounded-full mb-6">
                    <Package className="h-12 w-12 text-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">No tienes productos aún</h2>
                <p className="text-muted-foreground max-w-sm mb-8">
                    Comienza agregando tu primer producto para empezar a vender en tu tienda.
                </p>
                <Link href="/tenant/products/new">
                    <Button size="lg" className="rounded-full">
                        <Plus className="mr-2 h-5 w-5" /> Crear Primer Producto
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
                    <p className="text-sm text-muted-foreground">
                        Gestiona tu inventario ({products.length} productos)
                    </p>
                </div>
                <div className="flex gap-2">
                    <ImportProductsDialog onImportSuccess={fetchProducts} />
                    <Link href="/tenant/products/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar productos..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Activos</SelectItem>
                        <SelectItem value="archived">Archivados</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardHeader className="p-0" />
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Imagen</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Precio</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden relative">
                                            {getProductImage(product) ? (
                                                <Image src={getProductImage(product)!} alt={product.title || product.name || ""} fill className="object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                                    <Package className="h-6 w-6" />
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {product.title || product.name}
                                        {(product.status === 'archived' || !product.isActive) && <Badge variant="secondary" className="ml-2 text-xs">Archivado</Badge>}
                                    </TableCell>
                                    <TableCell>{product.category || "Sin categoría"}</TableCell>
                                    <TableCell>{new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(getProductPrice(product))}</TableCell>
                                    <TableCell>
                                        <Badge variant={getProductStock(product) > 10 ? "outline" : "destructive"} className={getProductStock(product) > 10 ? "text-green-600 border-green-200 bg-green-50" : ""}>
                                            {getProductStock(product)} un.
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <Link href={`/tenant/products/${product.id}`} className="w-full cursor-pointer">
                                                        <DropdownMenuItem>
                                                            <Filter className="mr-2 h-4 w-4" /> Editar
                                                        </DropdownMenuItem>
                                                    </Link>
                                                    <DropdownMenuItem onClick={() => handleDuplicate(product)}>
                                                        <Copy className="mr-2 h-4 w-4" /> Duplicar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(product.id!)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredProducts.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No se encontraron resultados para tu búsqueda.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* MOBILE CARD VIEW */}
            <div className="md:hidden space-y-4">
                {filteredProducts.map((product) => {
                    const img = getProductImage(product);
                    return (
                        <div key={product.id} className="bg-white dark:bg-zinc-900 border rounded-lg p-4 shadow-sm flex items-start gap-4 relative">
                            <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted border flex-shrink-0">
                                {img ? (
                                    <Image src={img} alt={product.title || product.name || ""} fill className="object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No img</div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-semibold text-sm truncate pr-8">{product.title || product.name}</h3>
                                </div>

                                <p className="text-sm font-medium">
                                    {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(getProductPrice(product))}
                                </p>

                                <div className="flex items-center gap-2 pt-1">
                                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="text-[10px] h-5 px-1.5 capitalize">
                                        {product.status || 'Active'}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {getProductStock(product)} stock
                                    </span>
                                </div>
                            </div>

                            {/* Mobile Actions Overlay */}
                            <div className="absolute top-2 right-2 z-10">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/tenant/products/${product.id}`}>Editar</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDuplicate(product)}>
                                            Duplicar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(product.id!)}>
                                            Eliminar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Click target for whole card except menu */}
                            <Link href={`/tenant/products/${product.id}`} className="absolute inset-0 z-0" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
