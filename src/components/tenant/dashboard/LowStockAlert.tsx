"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Product } from "@/types";

export function LowStockAlert() {
    const { storeId } = useAuth();
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!storeId) {
            setLoading(false);
            return;
        }

        // Note: Ideally we should filter this on the server/query side, 
        // but 'stock <= threshold' comparison where threshold is a field on the doc is hard in Firestore.
        // So we fetch active products and filter client side for this widget (limited to recent/all? maybe limits).
        // For scalability, we'd need a cloud function to tag products as 'lowStock: true'.
        // For now, we fetch all products and filter. Optimisation: Limit to 100?

        const q = query(
            collection(db, "products"),
            where("storeId", "==", storeId),
            where("isActive", "==", true)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const low: Product[] = [];
            snapshot.forEach(doc => {
                const p = { id: doc.id, ...doc.data() } as Product;
                const threshold = p.lowStockThreshold || 5; // Default to 5 if not set

                let isLow = false;
                if (p.hasVariants && p.variants) {
                    // Check if ANY variant is low
                    if (p.variants.some(v => v.stock <= threshold)) isLow = true;
                } else {
                    if ((p.stock || 0) <= threshold) isLow = true;
                }

                if (isLow) low.push(p);
            });
            setLowStockProducts(low.slice(0, 5)); // Show top 5
            setLoading(false);
        });

        return () => unsubscribe();
    }, [storeId]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-5 w-[140px] mb-1" />
                    <Skeleton className="h-4 w-[200px]" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex justify-between">
                            <Skeleton className="h-4 w-[120px]" />
                            <Skeleton className="h-4 w-[40px]" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                            Alerta de Stock
                        </CardTitle>
                        <CardDescription>Productos con inventario crítico.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                {lowStockProducts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground min-h-[150px]">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mb-2 opacity-80" />
                        <p className="font-medium text-foreground">Todo en orden</p>
                        <p className="text-sm">No tienes productos con bajo stock.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {lowStockProducts.map(product => {
                            // Determine display stock
                            let stockDisplay = "";
                            if (product.hasVariants && product.variants) {
                                const lowVariants = product.variants.filter(v => v.stock <= (product.lowStockThreshold || 5));
                                stockDisplay = `${lowVariants.length} variantes críticas`;
                            } else {
                                stockDisplay = `${product.stock} un.`;
                            }

                            return (
                                <div key={product.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    <div className="min-w-0 flex-1 mr-4">
                                        <p className="text-sm font-medium truncate">{product.name}</p>
                                    </div>
                                    <Badge variant="destructive" className="whitespace-nowrap">
                                        {stockDisplay}
                                    </Badge>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
            {lowStockProducts.length > 0 && (
                <div className="p-4 pt-0 mt-auto border-t bg-muted/20">
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground" asChild>
                        <Link href="/tenant/products?filter=low-stock">
                            Ver inventario completo <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            )}
        </Card>
    );
}
