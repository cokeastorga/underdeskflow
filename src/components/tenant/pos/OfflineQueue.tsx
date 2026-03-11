"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { offlineQueue, OfflineSale } from "@/lib/pos/offline-db";
import { WifiOff, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function OfflineQueue() {
    const { user } = useAuth();
    const [pending, setPending] = useState<OfflineSale[]>([]);
    const [syncing, setSyncing] = useState(false);
    const [isOnline, setIsOnline] = useState(typeof window !== "undefined" ? navigator.onLine : true);

    const loadPending = async () => {
        const items = await offlineQueue.getPending();
        setPending(items);
    };

    useEffect(() => {
        loadPending();
        const onOnline = () => {
            setIsOnline(true);
            syncNow(); // Auto-sync on reconnect
        };
        const onOffline = () => setIsOnline(false);
        window.addEventListener("online", onOnline);
        window.addEventListener("offline", onOffline);
        return () => {
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
        };
    }, []);

    const syncNow = async () => {
        if (!user || syncing) return;
        const items = await offlineQueue.getPending();
        if (items.length === 0) return;

        setSyncing(true);
        let success = 0;
        let failed = 0;

        for (const item of items) {
            if (!item.id) continue;
            await offlineQueue.markSyncing(item.id);
            try {
                const token = await user.getIdToken();
                const res = await fetch("/api/pos/sale", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(item.payload),
                });
                if (res.ok) {
                    await offlineQueue.markSynced(item.id);
                    success++;
                } else {
                    const data = await res.json();
                    await offlineQueue.markFailed(item.id, data.error ?? "Server error");
                    failed++;
                }
            } catch (err: any) {
                await offlineQueue.markFailed(item.id!, err.message);
                failed++;
            }
        }

        await offlineQueue.clearSynced();
        await loadPending();
        setSyncing(false);

        if (success > 0) toast.success(`${success} venta(s) sincronizadas correctamente.`);
        if (failed > 0) toast.error(`${failed} venta(s) fallaron al sincronizar. Reintenta más tarde.`);
    };

    if (pending.length === 0) return null;

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm">
            <WifiOff className="h-4 w-4 text-amber-500 shrink-0" />
            <div className="flex-1">
                <p className="font-semibold text-amber-700 dark:text-amber-400">
                    {pending.length} venta{pending.length > 1 ? "s" : ""} pendiente{pending.length > 1 ? "s" : ""} de sincronizar
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {isOnline ? "Puedes sincronizar ahora." : "Esperando conexión..."}
                </p>
            </div>
            <Badge variant="outline" className="border-amber-500/40 text-amber-600 shrink-0">
                {pending.filter(p => p.status === "failed").length > 0 && (
                    <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {pending.length}
            </Badge>
            <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-amber-500/40 hover:bg-amber-500/10 shrink-0"
                onClick={syncNow}
                disabled={syncing || !isOnline}
            >
                {syncing ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                {syncing ? "Sincronizando..." : "Sync"}
            </Button>
        </div>
    );
}
