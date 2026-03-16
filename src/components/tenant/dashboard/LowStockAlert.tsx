"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface InventoryBalance {
    id: string;
    variantId: string;
    locationId: string;
    stock: number;
    // Denormalized fields (written by transferStock / receiving)
    variantName?: string;
    productName?: string;
    sku?: string;
    lowStockThreshold?: number;
}

interface AlertItem {
    variantId: string;
    variantName: string;
    productName: string;
    sku?: string;
    locationId: string;
    locationName: string;
    stock: number;
    threshold: number;
}

export function LowStockAlert() {
    const { storeId } = useAuth();
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!storeId) { setLoading(false); return; }

        // ── Step 1: Subscribe to inventory_balances for this store ──────────
        const q = query(
            collection(db, "inventory_balances"),
            where("storeId", "==", storeId)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const balances = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as InventoryBalance));

            // ── Step 2: Collect variantIds not already denormalized ─────────
            const unnamedVariantIds = [
                ...new Set(
                    balances
                        .filter(b => !b.variantName && !b.productName)
                        .map(b => b.variantId)
                )
            ];

            // Map variantId → { name, productName, sku }
            const variantMeta: Record<string, { name: string; productName: string; sku?: string }> = {};

            if (unnamedVariantIds.length > 0) {
                // Chunked fetch (Firestore "in" limit = 30)
                const chunks: string[][] = [];
                for (let i = 0; i < unnamedVariantIds.length; i += 30)
                    chunks.push(unnamedVariantIds.slice(i, i + 30));

                await Promise.all(chunks.map(async (chunk) => {
                    const vSnap = await getDocs(
                        query(collection(db, "variants"), where("__name__", "in", chunk))
                    );
                    vSnap.forEach(d => {
                        const v = d.data();
                        variantMeta[d.id] = {
                            name: v.name ?? d.id,
                            productName: v.productName ?? v.name ?? d.id,
                            sku: v.sku,
                        };
                    });
                }));
            }

            // ── Step 3: Fetch branch names once ─────────────────────────────
            const locationIds = [...new Set(balances.map(b => b.locationId))];
            const branchNames: Record<string, string> = {};

            if (locationIds.length > 0) {
                try {
                    const res = await fetch(`/api/store/branches?storeId=${storeId}`);
                    const data = await res.json();
                    (data.branches ?? []).forEach((b: { id: string; name: string }) => {
                        branchNames[b.id] = b.name;
                    });
                } catch { /* non-fatal */ }
            }

            // ── Step 4: Build alert list ─────────────────────────────────────
            const lowItems: AlertItem[] = [];
            for (const balance of balances) {
                const threshold = balance.lowStockThreshold ?? 5;
                if (balance.stock <= threshold) {
                    const meta = variantMeta[balance.variantId];
                    lowItems.push({
                        variantId:    balance.variantId,
                        variantName:  balance.variantName ?? meta?.name ?? balance.variantId,
                        productName:  balance.productName ?? meta?.productName ?? balance.variantId,
                        sku:          balance.sku ?? meta?.sku,
                        locationId:   balance.locationId,
                        locationName: branchNames[balance.locationId] ?? balance.locationId,
                        stock:        balance.stock,
                        threshold,
                    });
                }
            }

            // Sort: most critical (closest to 0) first, cap at 10
            lowItems.sort((a, b) => a.stock - b.stock);
            setAlerts(lowItems.slice(0, 10));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [storeId]);

    // ── Loading skeleton ───────────────────────────────────────────────────
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
                            <Skeleton className="h-4 w-[160px]" />
                            <Skeleton className="h-4 w-[60px]" />
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
                            Alerta de Stock por Sucursal
                        </CardTitle>
                        <CardDescription>
                            Balances críticos por ubicación física.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                {alerts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground min-h-[150px]">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mb-2 opacity-80" />
                        <p className="font-medium text-foreground">Todo en orden</p>
                        <p className="text-sm">Todas las sucursales tienen stock suficiente.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alerts.map((item, idx) => (
                            <div
                                key={`${item.variantId}-${item.locationId}-${idx}`}
                                className="flex items-start justify-between gap-3 border-b pb-3 last:border-0 last:pb-0"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold truncate">{item.productName}</p>
                                    {item.sku && (
                                        <p className="text-xs text-muted-foreground font-mono">SKU: {item.sku}</p>
                                    )}
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                        <p className="text-xs text-muted-foreground truncate uppercase tracking-wide font-medium">
                                            {item.locationName}
                                        </p>
                                    </div>
                                </div>
                                <Badge
                                    variant={item.stock === 0 ? "destructive" : "outline"}
                                    className={`whitespace-nowrap shrink-0 ${
                                        item.stock === 0
                                            ? "bg-red-100 text-red-700 border-red-300"
                                            : "bg-orange-50 text-orange-700 border-orange-200"
                                    }`}
                                >
                                    {item.stock === 0 ? "⛔ Sin stock" : `⚠️ ${item.stock} un.`}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
            {alerts.length > 0 && (
                <div className="p-4 pt-0 mt-auto border-t bg-muted/20">
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground" asChild>
                        <Link href="/admin/inventory/transfers">
                            Gestionar transferencias <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            )}
        </Card>
    );
}
