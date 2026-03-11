"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, getDoc } from "firebase/firestore";
import { ChefHat, Printer, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface KitchenOrder {
    id: string;
    orderNumber?: string;
    items: { name: string; quantity: number; notes?: string }[];
    status: "pending" | "preparing" | "ready" | "delivered";
    createdAt: any;
    channel: string;
}

function timeSince(ts: any): string {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    return `${Math.floor(diff / 3600)}h`;
}

const STATUS_SEQUENCE = ["pending", "preparing", "ready"] as const;
const STATUS_LABELS: Record<string, string> = {
    pending: "Pendiente",
    preparing: "Preparando",
    ready: "Listo",
};
const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-500/10 border-amber-500/30 text-amber-600",
    preparing: "bg-blue-500/10 border-blue-500/30 text-blue-600",
    ready: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600",
};

export function KitchenTickets() {
    const { storeId, user } = useAuth();
    const [orders, setOrders] = useState<KitchenOrder[]>([]);
    const [printing, setPrinting] = useState<string | null>(null);

    // ── Live listener ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!storeId) return;
        const q = query(
            collection(db, "stores", storeId, "orders"),
            where("channel", "==", "pos"),
            where("status", "in", ["pending", "preparing"]),
            orderBy("createdAt", "asc")
        );
        const unsub = onSnapshot(q, (snap) => {
            setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as KitchenOrder)));
        });
        return () => unsub();
    }, [storeId]);

    // ── Advance status ─────────────────────────────────────────────────────
    const advanceStatus = async (orderId: string, currentStatus: string) => {
        if (!storeId) return;
        const nextIdx = STATUS_SEQUENCE.indexOf(currentStatus as any) + 1;
        if (nextIdx >= STATUS_SEQUENCE.length) return;
        const nextStatus = STATUS_SEQUENCE[nextIdx];

        try {
            await updateDoc(doc(db, "stores", storeId, "orders", orderId), {
                status: nextStatus,
                updatedAt: new Date(),
            });
        } catch {
            toast.error("Error al actualizar el estado");
        }
    };

    // ── Print ticket — TCP/ESC-POS with window.print() fallback ─────────────
    const printTicket = useCallback(async (order: KitchenOrder) => {
        setPrinting(order.id);
        try {
            const token = await user?.getIdToken();

            // 1. Get ticket HTML/text from API
            const ticketRes = await fetch("/api/pos/kitchen/ticket", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    orderId: order.id,
                    items: order.items,
                    createdAt: order.createdAt?.toDate?.()?.toISOString(),
                }),
            });
            const ticketData = await ticketRes.json();
            if (!ticketRes.ok) throw new Error(ticketData.error);

            // 2. Check if TCP printer is configured
            let usedTCP = false;
            if (storeId) {
                try {
                    const printerSnap = await getDoc(doc(db, "stores", storeId, "settings", "kitchen_printer"));
                    const printerCfg = printerSnap.exists() ? printerSnap.data() : null;

                    if (printerCfg?.enabled && printerCfg?.printerIp) {
                        const tcpRes = await fetch("/api/pos/kitchen/print", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            body: JSON.stringify({
                                printerIp: printerCfg.printerIp,
                                printerPort: printerCfg.printerPort ?? 9100,
                                ticketText: ticketData.ticketText,
                            }),
                        });
                        if (tcpRes.ok) {
                            usedTCP = true;
                            toast.success("Ticket enviado a impresora de cocina");
                        }
                    }
                } catch (tcpErr) {
                    console.warn("TCP printer failed, falling back to window.print()", tcpErr);
                }
            }

            // 3. Fallback: window.print() via hidden iframe
            if (!usedTCP) {
                const iframe = document.createElement("iframe");
                iframe.style.display = "none";
                document.body.appendChild(iframe);
                iframe.contentDocument!.write(ticketData.ticketHtml);
                iframe.contentDocument!.close();
                iframe.contentWindow!.focus();
                iframe.contentWindow!.print();
                setTimeout(() => document.body.removeChild(iframe), 2000);
                if (!storeId) toast.info("Usando impresión del navegador (no hay impresora de red configurada)");
            }
        } catch (err: any) {
            toast.error(err.message ?? "Error al generar ticket");
        } finally {
            setPrinting(null);
        }
    }, [user, storeId]);

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                        <ChefHat className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                        <h2 className="font-semibold">Comandas de cocina</h2>
                        <p className="text-xs text-muted-foreground">
                            {orders.length} orden{orders.length !== 1 ? "es" : ""} activa{orders.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-muted-foreground">En vivo</span>
                </div>
            </div>

            {/* Orders list */}
            {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                    <ChefHat className="h-12 w-12 opacity-20" />
                    <p className="text-sm">Sin comandas pendientes</p>
                    <p className="text-xs">Las órdenes del POS aparecerán aquí en tiempo real</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {orders.map((order) => {
                        const statusColor = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending;
                        const nextStatus = STATUS_SEQUENCE[STATUS_SEQUENCE.indexOf(order.status as any) + 1];
                        const elapsed = timeSince(order.createdAt);

                        return (
                            <Card key={order.id} className={`border-2 ${statusColor} transition-all`}>
                                <CardContent className="p-4 space-y-3">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-mono text-xs text-muted-foreground">
                                                #{String(order.id).slice(-8).toUpperCase()}
                                            </p>
                                            <Badge variant="outline" className={`mt-1 text-xs ${statusColor}`}>
                                                {STATUS_LABELS[order.status]}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                            <Clock className="h-3 w-3" />
                                            {elapsed}
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div className="space-y-1.5 border-t border-current/10 pt-3">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="text-sm">
                                                <span className="font-bold mr-1">{item.quantity}x</span>
                                                <span>{item.name}</span>
                                                {item.notes && (
                                                    <p className="text-xs text-muted-foreground ml-4">⚑ {item.notes}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-1">
                                        <Button
                                            size="sm" variant="outline"
                                            className="h-7 text-xs flex-1 gap-1"
                                            onClick={() => printTicket(order)}
                                            disabled={printing === order.id}
                                        >
                                            {printing === order.id
                                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                                : <Printer className="h-3 w-3" />}
                                            Imprimir
                                        </Button>
                                        {nextStatus && (
                                            <Button
                                                size="sm"
                                                className="h-7 text-xs flex-1 gap-1"
                                                onClick={() => advanceStatus(order.id, order.status)}
                                            >
                                                <CheckCircle2 className="h-3 w-3" />
                                                {nextStatus === "preparing" ? "Preparando" : "Listo"}
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
