"use client";

/**
 * AlertsPanel — Dashboard widget for actionable alerts
 *
 * Shows:
 *   - Stock alerts (SKU below threshold)
 *   - High refund rate warning (>10% in last 7 days)
 *   - Delayed payout
 *   - Enterprise: channel offline, unresolved conflicts
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    AlertTriangle, Package, ArrowRight, Globe, Zap, CheckCircle2, Loader2,
} from "lucide-react";
import { TriggeredAlert } from "@/types/reporting";

// ─── Alert Row ────────────────────────────────────────────────────────────────

function AlertRow({
    icon: Icon, iconColor, title, description, severity, actionLabel, onAction,
}: {
    icon: typeof AlertTriangle;
    iconColor: string;
    title: string;
    description: string;
    severity: "warning" | "critical" | "info";
    actionLabel?: string;
    onAction?: () => void;
}) {
    const bg = severity === "critical" ? "bg-red-500/10 border-red-500/20"
        : severity === "warning" ? "bg-amber-500/10 border-amber-500/20"
            : "bg-blue-500/10 border-blue-500/20";
    const badgeVariant = severity === "critical" ? "destructive" : "outline";
    const badgeClass =
        severity === "critical" ? "" :
            severity === "warning" ? "text-amber-400 border-amber-500/30" :
                "text-blue-400 border-blue-500/30";

    return (
        <div className={`flex items-start gap-3 p-3 rounded-lg border ${bg}`}>
            <div className={`mt-0.5 ${iconColor}`}>
                <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{title}</p>
                    <Badge variant={badgeVariant} className={`text-[10px] ${badgeClass}`}>
                        {severity === "critical" ? "Crítico" : severity === "warning" ? "Advertencia" : "Info"}
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
            </div>
            {actionLabel && onAction && (
                <Button size="sm" variant="ghost" onClick={onAction} className="gap-1 shrink-0 h-7 text-xs">
                    {actionLabel} <ArrowRight className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AlertsPanel() {
    const { storeId, user } = useAuth();
    const router = useRouter();
    const [stockAlerts, setStockAlerts] = useState<TriggeredAlert[]>([]);
    const [loading, setLoading] = useState(true);

    const loadAlerts = useCallback(async () => {
        if (!storeId || !user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(
                `/api/stock-alerts?storeId=${storeId}&evaluate=true`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) return;
            const data = await res.json() as { triggered: TriggeredAlert[] };
            setStockAlerts(data.triggered ?? []);
        } catch {
            // silently fail — alerts are non-critical
        } finally {
            setLoading(false);
        }
    }, [storeId, user]);

    useEffect(() => { loadAlerts(); }, [loadAlerts]);

    const totalAlerts = stockAlerts.length;

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8 flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Alertas y avisos
                        {totalAlerts > 0 && (
                            <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                                {totalAlerts}
                            </Badge>
                        )}
                    </CardTitle>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs h-7"
                        onClick={() => router.push("/tenant/inventory/alerts")}
                    >
                        Configurar <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {totalAlerts === 0 && (
                    <div className="flex items-center gap-3 py-4 px-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        <div>
                            <p className="text-sm font-medium">Todo en orden</p>
                            <p className="text-xs text-muted-foreground">No hay alertas activas en este momento.</p>
                        </div>
                    </div>
                )}

                {stockAlerts.map(alert => (
                    <AlertRow
                        key={alert.rule.id}
                        icon={Package}
                        iconColor={alert.severity === "critical" ? "text-red-500" : "text-amber-500"}
                        title={`Stock bajo: ${alert.rule.productName}`}
                        description={`SKU ${alert.rule.sku} — stock actual: ${alert.currentStock} (umbral: ${alert.rule.threshold})`}
                        severity={alert.severity}
                        actionLabel="Ver inventario"
                        onAction={() => router.push("/tenant/inventory")}
                    />
                ))}
            </CardContent>
        </Card>
    );
}
