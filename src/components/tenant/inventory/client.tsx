"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";
import { Search, AlertTriangle, CheckCircle, XCircle, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { Product } from "@/types";

interface InventoryItem {
    id: string; // Product ID
    variantId?: string; // If variant
    title: string;
    sku: string;
    stock: number;
    lowStockThreshold: number;
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
    updatedAt: number;
    rawProduct: Product; // Keep reference for updates
}

export const InventoryClient = () => {
    const { storeId } = useAuth();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

    useEffect(() => {
        if (!storeId) return;

        const q = query(
            collection(db, "products"),
            where("storeId", "==", storeId),
            // orderBy("updatedAt", "desc") // Complex index required maybe?
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const inventoryList: InventoryItem[] = [];

            snapshot.forEach((doc) => {
                const product = { id: doc.id, ...doc.data() } as Product;

                // If product has variants, list each variant as a row
                // UNLESS variants array is empty (integrity check)
                if (product.hasVariants && product.variants && product.variants.length > 0) {
                    product.variants.forEach((variant: any) => {
                        inventoryList.push({
                            id: product.id,
                            variantId: variant.id,
                            title: `${product.name} - ${variant.title}`,
                            sku: variant.sku || "N/A",
                            stock: Number(variant.stock) || 0,
                            lowStockThreshold: Number(product.lowStockThreshold) || 0, // Variant inherited or override? Schema has inheritance usually.
                            status: getStockStatus(Number(variant.stock) || 0, Number(product.lowStockThreshold) || 0),
                            updatedAt: product.updatedAt || 0,
                            rawProduct: product
                        });
                    });
                } else {
                    // Simple product
                    inventoryList.push({
                        id: product.id,
                        title: product.name,
                        sku: product.sku || "N/A",
                        stock: Number(product.price === undefined ? 0 : (product as any).stock) || 0, // Accessing dynamic prop
                        lowStockThreshold: Number((product as any).lowStockThreshold) || 0,
                        status: getStockStatus(Number((product as any).stock) || 0, Number((product as any).lowStockThreshold) || 0),
                        updatedAt: product.updatedAt || 0,
                        rawProduct: product
                    });
                }
            });

            setItems(inventoryList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [storeId]);

    const getStockStatus = (stock: number, threshold: number) => {
        if (stock <= 0) return 'out_of_stock';
        if (threshold > 0 && stock <= threshold) return 'low_stock';
        return 'in_stock';
    };

    const handleStockUpdate = async (item: InventoryItem, delta: number) => {
        const newStock = Math.max(0, item.stock + delta);
        if (newStock === item.stock) return;

        try {
            const productRef = doc(db, "products", item.id);

            if (item.variantId) {
                // Update specific variant in the array
                const updatedVariants = (item.rawProduct.variants || []).map((v: any) => {
                    if (v.id === item.variantId) {
                        return { ...v, stock: newStock };
                    }
                    return v;
                });

                await updateDoc(productRef, {
                    variants: updatedVariants,
                    updatedAt: Date.now()
                });
            } else {
                // Update root stock
                await updateDoc(productRef, {
                    stock: newStock,
                    updatedAt: Date.now()
                });
            }
            toast.success("Stock actualizado");
        } catch (error) {
            console.error(error);
            toast.error("Error al actualizar stock");
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'all') return matchesSearch;
        if (filter === 'low') return matchesSearch && item.status === 'low_stock';
        if (filter === 'out') return matchesSearch && item.status === 'out_of_stock';
        return matchesSearch;
    });

    if (loading) return <div>Cargando inventario...</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Inventario</h2>
                    <p className="text-muted-foreground">
                        Control de existencias y alertas ({items.length} SKUs)
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total SKUs</CardTitle>
                        <Search className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{items.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bajo Stock</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {items.filter(i => i.status === 'low_stock').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Agotados</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {items.filter(i => i.status === 'out_of_stock').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between py-4">
                <Input
                    placeholder="Buscar por nombre o SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
                <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-[400px]">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="all">Todos</TabsTrigger>
                        <TabsTrigger value="low">Bajo Stock</TabsTrigger>
                        <TabsTrigger value="out">Agotados</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Producto / Variante</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                            <TableHead className="text-right">Stock</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No se encontraron productos.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredItems.map((item, idx) => (
                                <TableRow key={`${item.id}-${item.variantId || 'main'}`}>
                                    <TableCell className="font-medium">{item.title}</TableCell>
                                    <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                                    <TableCell className="text-center">
                                        {item.status === 'in_stock' && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">En Stock</Badge>}
                                        {item.status === 'low_stock' && <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200">Bajo Stock</Badge>}
                                        {item.status === 'out_of_stock' && <Badge variant="destructive">Agotado</Badge>}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-lg">
                                        {item.stock}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleStockUpdate(item, -1)}
                                                disabled={item.stock <= 0}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleStockUpdate(item, 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
