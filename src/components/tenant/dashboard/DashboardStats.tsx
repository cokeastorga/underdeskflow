"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, ShoppingBag, AlertTriangle, Package } from "lucide-react";
import { Product } from "@/types";

export function DashboardStats() {
    const { storeId } = useAuth();
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        lowStockCount: 0,
        totalProducts: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!storeId) return;

        // 1. Orders & Revenue (Real-time)
        const ordersQuery = query(collection(db, "orders"), where("storeId", "==", storeId));
        const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
            let count = 0;
            let revenue = 0;
            snapshot.forEach(doc => {
                const data = doc.data();
                count++;
                if (data.status !== 'cancelled' && data.paymentStatus === 'paid') {
                    revenue += data.total || 0;
                }
            });
            setStats(prev => ({ ...prev, totalOrders: count, totalRevenue: revenue }));
        });

        // 2. Products & Low Stock (Real-time)
        const productsQuery = query(collection(db, "products"), where("storeId", "==", storeId));
        const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
            let productCount = 0;
            let lowStock = 0;

            snapshot.forEach(doc => {
                const p = doc.data() as Product;
                productCount++;

                // Check stock logic
                const threshold = p.lowStockThreshold || 0;

                if (p.hasVariants && p.variants) {
                    p.variants.forEach(v => {
                        if (v.stock <= threshold) lowStock++;
                    });
                } else {
                    if ((p.stock || 0) <= threshold) lowStock++;
                }
            });
            setStats(prev => ({ ...prev, totalProducts: productCount, lowStockCount: lowStock }));
            setLoading(false);
        });

        return () => {
            unsubscribeOrders();
            unsubscribeProducts();
        };
    }, [storeId]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-[60px] mb-1" />
                            <Skeleton className="h-3 w-[80px]" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(stats.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">de ventas pagadas</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalOrders}</div>
                    <p className="text-xs text-muted-foreground">total histórico</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Productos</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.totalProducts}</div>
                    <p className="text-xs text-muted-foreground">activos en tienda</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Alerta de Stock</CardTitle>
                    <AlertTriangle className={`h-4 w-4 ${stats.lowStockCount > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${stats.lowStockCount > 0 ? 'text-yellow-600' : ''}`}>{stats.lowStockCount}</div>
                    <p className="text-xs text-muted-foreground">items bajo stock mínimo</p>
                </CardContent>
            </Card>
        </div>
    );
}
