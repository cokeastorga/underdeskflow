"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Clock, RefreshCw, AlertCircle, History,
    TrendingUp, TrendingDown, Layers, Target
} from "lucide-react";
import { ProductChangeEvent, CHANNEL_DISPLAY } from "@/types/channels";

interface ProductAuditLogProps {
    productId: string;
    storeId: string;
    token: string;
}

export function ProductAuditLog({ productId, storeId, token }: ProductAuditLogProps) {
    const [history, setHistory] = useState<ProductChangeEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/products/${productId}/history?storeId=${storeId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch product history");
            const data = await res.json();
            setHistory(data.history || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [productId, storeId, token]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center py-8 text-center text-red-500">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>{error}</p>
                <button onClick={fetchHistory} className="mt-2 text-sm text-blue-500 hover:underline">
                    Retry
                </button>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <History className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No se encontraron cambios registrados para este producto.</p>
            </div>
        );
    }

    return (
        <div className="relative space-y-4">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-px bg-border/50" />

            {history.map((event, idx) => {
                const channelInfo = event.channelType in CHANNEL_DISPLAY
                    ? CHANNEL_DISPLAY[event.channelType as keyof typeof CHANNEL_DISPLAY]
                    : null;

                const isNumeric = !isNaN(Number(event.newValue)) && !isNaN(Number(event.previousValue));
                const isPrice = event.field === "price";
                const isStock = event.field === "stock";

                let diffIcon = <RefreshCw className="h-3 w-3" />;
                if (isNumeric) {
                    const diff = Number(event.newValue) - Number(event.previousValue);
                    if (diff > 0) diffIcon = <TrendingUp className="h-3 w-3 text-emerald-500" />;
                    else if (diff < 0) diffIcon = <TrendingDown className="h-3 w-3 text-red-500" />;
                }

                return (
                    <div key={event.id} className="relative pl-12">
                        {/* Event Dot */}
                        <div className={`absolute left-0 top-1.5 h-10 w-10 rounded-full border-4 border-background flex items-center justify-center ${idx === 0 ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted text-muted-foreground"
                            }`}>
                            {isPrice ? <Target className="h-4 w-4" /> : isStock ? <Layers className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                        </div>

                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{new Date(event.createdAt).toLocaleString("es-CL")}</span>
                                <span>•</span>
                                <Badge variant="secondary" className="text-[10px] py-0 h-4">
                                    {event.field.toUpperCase()}
                                </Badge>
                                {event.resolved && (
                                    <Badge variant="outline" className="text-[10px] py-0 h-4 text-emerald-500 border-emerald-500/20">
                                        RESUELTO
                                    </Badge>
                                )}
                            </div>

                            <Card className={`border-none ${idx === 0 ? "bg-muted/50" : "bg-transparent"}`}>
                                <CardContent className="p-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">
                                                {event.source === "channel_sync" ? (
                                                    <span className="flex items-center gap-1.5">
                                                        Actualización desde {channelInfo?.name || event.channelType}
                                                        {channelInfo?.icon}
                                                    </span>
                                                ) : event.source === "manual" ? (
                                                    "Cambio manual"
                                                ) : (
                                                    "Actualización vía API"
                                                )}
                                            </p>
                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                                                <span className="text-muted-foreground line-through decoration-muted-foreground/30">
                                                    {isPrice ? `$${Number(event.previousValue).toLocaleString("es-CL")}` : event.previousValue}
                                                </span>
                                                {diffIcon}
                                                <span className="font-semibold">
                                                    {isPrice ? `$${Number(event.newValue).toLocaleString("es-CL")}` : event.newValue}
                                                </span>
                                            </div>
                                        </div>

                                        {event.resolutionStrategy && (
                                            <div className="text-right">
                                                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Estrategia</p>
                                                <p className="text-xs">{event.resolutionStrategy.replace("_", " ")}</p>
                                            </div>
                                        )}
                                    </div>
                                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                                        <p className="mt-2 text-[10px] text-muted-foreground font-mono truncate">
                                            Trace: {String(event.metadata.traceId || event.metadata.correlationId || "").slice(0, 16)}...
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
