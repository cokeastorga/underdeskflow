"use client";

/**
 * Stock Alert Configuration Page — /tenant/inventory/alerts
 *
 * Lets merchants set per-SKU stock thresholds.
 * Rows show: product name, SKU, current stock (from products collection), threshold input.
 * Save/delete via /api/stock-alerts.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Bell, BellOff, Save, Trash2, AlertTriangle, Package, Loader2, ArrowLeft,
} from "lucide-react";
import { StockAlertRule } from "@/types/reporting";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductRow {
    id: string;
    name: string;
    sku: string;
    stock: number;
    rule?: StockAlertRule;
    tempThreshold: string;
    tempFloor: string;
    saving: boolean;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function StockAlertsPage() {
    const { storeId, user } = useAuth();
    const router = useRouter();
    const [rows, setRows] = useState<ProductRow[]>([]);
    const [loading, setLoading] = useState(true);

    const getToken = useCallback(() => user?.getIdToken() ?? Promise.resolve(""), [user]);

    const loadData = useCallback(async () => {
        if (!storeId || !user) return;
        setLoading(true);
        try {
            const token = await getToken();

            // Fetch products from Firestore (client-side for simplicity)
            const productsRef = collection(db, "stores", storeId, "products");
            const productsSnap = await getDocs(query(productsRef, orderBy("name", "asc"), limit(100)));
            const products = productsSnap.docs.map(d => ({
                id: d.id,
                name: d.data().name ?? d.data().title ?? "Sin nombre",
                sku: d.data().sku ?? d.id.slice(0, 8),
                stock: d.data().stock ?? d.data().inventory ?? 0,
            }));

            // Fetch existing rules
            const rulesRes = await fetch(`/api/stock-alerts?storeId=${storeId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const rulesData = rulesRes.ok ? await rulesRes.json() as { rules: StockAlertRule[] } : { rules: [] };
            const rulesMap = new Map(rulesData.rules.map(r => [r.productId, r]));

            setRows(products.map(p => ({
                ...p,
                rule: rulesMap.get(p.id),
                tempThreshold: rulesMap.get(p.id)?.threshold?.toString() ?? "",
                tempFloor: rulesMap.get(p.id)?.criticalFloor?.toString() ?? "",
                saving: false,
            })));
        } finally {
            setLoading(false);
        }
    }, [storeId, user, getToken]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSave = async (row: ProductRow) => {
        const threshold = parseInt(row.tempThreshold);
        if (isNaN(threshold) || threshold < 0) {
            toast.error("El umbral debe ser un número positivo");
            return;
        }

        setRows(prev => prev.map(r => r.id === row.id ? { ...r, saving: true } : r));
        try {
            const token = await getToken();
            const body = {
                storeId,
                productId: row.id,
                sku: row.sku,
                productName: row.name,
                threshold,
                ...(row.tempFloor ? { criticalFloor: parseInt(row.tempFloor) } : {}),
                enabled: true,
            };
            const res = await fetch("/api/stock-alerts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error("Error saving rule");
            const data = await res.json() as { rule: StockAlertRule };
            setRows(prev => prev.map(r => r.id === row.id ? { ...r, rule: data.rule, saving: false } : r));
            toast.success(`Alerta configurada para ${row.name}`);
        } catch {
            toast.error("Error al guardar la alerta");
            setRows(prev => prev.map(r => r.id === row.id ? { ...r, saving: false } : r));
        }
    };

    const handleDelete = async (row: ProductRow) => {
        if (!row.rule) return;
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, saving: true } : r));
        try {
            const token = await getToken();
            await fetch(`/api/stock-alerts?storeId=${storeId}&ruleId=${row.rule!.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setRows(prev => prev.map(r => r.id === row.id
                ? { ...r, rule: undefined, tempThreshold: "", tempFloor: "", saving: false }
                : r
            ));
            toast.success(`Alerta eliminada para ${row.name}`);
        } catch {
            toast.error("Error al eliminar la alerta");
            setRows(prev => prev.map(r => r.id === row.id ? { ...r, saving: false } : r));
        }
    };

    const activeCount = rows.filter(r => r.rule).length;
    const triggeredCount = rows.filter(r => r.rule && r.stock <= r.rule.threshold).length;

    return (
        <div className="space-y-6 max-w-4xl mx-auto p-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                </Button>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Alertas de stock</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Configura umbrales por producto — recibirás alertas en el dashboard cuando el stock sea igual o menor al umbral.
                    </p>
                </div>
                <div className="text-right text-sm">
                    <p className="font-semibold">{activeCount} alertas activas</p>
                    {triggeredCount > 0 && (
                        <p className="text-amber-500 text-xs flex items-center gap-1 justify-end">
                            <AlertTriangle className="h-3 w-3" /> {triggeredCount} producto{triggeredCount !== 1 ? "s" : ""} bajo umbral
                        </p>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <Card>
                    <div className="divide-y divide-border/30">
                        {rows.length === 0 && (
                            <div className="py-16 text-center text-muted-foreground text-sm">
                                <Package className="h-8 w-8 mx-auto mb-3 opacity-40" />
                                No hay productos en tu catálogo todavía.
                            </div>
                        )}
                        {rows.map(row => {
                            const isTriggered = row.rule && row.stock <= row.rule.threshold;
                            const isCritical = row.rule?.criticalFloor !== undefined && row.stock <= row.rule.criticalFloor;
                            return (
                                <div key={row.id} className="flex items-center gap-4 px-5 py-3">
                                    {/* Product info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium truncate">{row.name}</p>
                                            {isTriggered && (
                                                <Badge variant={isCritical ? "destructive" : "outline"}
                                                    className={!isCritical ? "text-amber-400 border-amber-500/30 text-[10px]" : "text-[10px]"}>
                                                    {isCritical ? "Crítico" : "⚠ Bajo"}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            SKU: {row.sku} · Stock actual: <span className={isTriggered ? "text-amber-400 font-medium" : ""}>{row.stock}</span>
                                        </p>
                                    </div>

                                    {/* Rule icon */}
                                    <div className={row.rule ? "text-amber-500" : "text-muted-foreground/30"}>
                                        {row.rule ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                                    </div>

                                    {/* Threshold input */}
                                    <div className="flex items-center gap-2">
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] text-muted-foreground">Advertencia (≤)</p>
                                            <Input
                                                type="number"
                                                min={0}
                                                placeholder="—"
                                                value={row.tempThreshold}
                                                onChange={e => setRows(prev => prev.map(r => r.id === row.id ? { ...r, tempThreshold: e.target.value } : r))}
                                                className="w-20 h-7 text-sm px-2"
                                            />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] text-muted-foreground">Crítico (≤)</p>
                                            <Input
                                                type="number"
                                                min={0}
                                                placeholder="—"
                                                value={row.tempFloor}
                                                onChange={e => setRows(prev => prev.map(r => r.id === row.id ? { ...r, tempFloor: e.target.value } : r))}
                                                className="w-20 h-7 text-sm px-2"
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-7 gap-1 text-xs"
                                            disabled={row.saving || !row.tempThreshold}
                                            onClick={() => handleSave(row)}
                                        >
                                            {row.saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                            Guardar
                                        </Button>
                                        {row.rule && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 text-red-500 hover:text-red-500 hover:bg-red-500/10"
                                                disabled={row.saving}
                                                onClick={() => handleDelete(row)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            )}

            <p className="text-xs text-muted-foreground">
                Las alertas se evalúan al cargar el panel de control. Puedes tener hasta 2 niveles de alerta por producto: <strong>Advertencia</strong> (stock ≤ umbral) y <strong>Crítico</strong> (stock ≤ piso crítico).
            </p>
        </div>
    );
}
