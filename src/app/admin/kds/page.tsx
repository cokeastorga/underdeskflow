"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { OrderFulfillment, FulfillmentStatus } from "@/domains/fulfillment/types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";

interface Branch { id: string; name: string; }

/**
 * Kitchen / Warehouse Display System (KDS)
 * Tablet-optimized view showing only PENDING and PREPARING cards.
 * Large touch targets designed for gloves, busy kitchens, and warehouse floors.
 */
export default function KDSPage() {
    const searchParams = useSearchParams();
    const storeId = searchParams.get("storeId") ?? undefined;

    const [tickets,   setTickets]   = useState<OrderFulfillment[]>([]);
    const [loading,   setLoading]   = useState(false);
    const [advancing, setAdvancing] = useState<string | null>(null);
    const [branches,  setBranches]  = useState<Branch[]>([]);
    const [branchId,  setBranchId]  = useState<string>("ALL");

    // Load branches once
    useEffect(() => {
        if (!storeId) return;
        fetch(`/api/store/branches?storeId=${storeId}`)
            .then(r => r.json())
            .then(data => setBranches((data.branches ?? []).filter((b: Branch & { isActive?: boolean }) => b.isActive !== false)))
            .catch(() => {});
    }, [storeId]);

    const fetchTickets = useCallback(async () => {
        if (!storeId) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ storeId });
            if (branchId !== "ALL") params.set("branchId", branchId);
            const baseQuery = params.toString();

            const [pendingRes, preparingRes] = await Promise.all([
                fetch(`/api/fulfillments?${baseQuery}&status=PENDING`),
                fetch(`/api/fulfillments?${baseQuery}&status=PREPARING`),
            ]);
            const [pendingData, preparingData] = await Promise.all([
                pendingRes.json(),
                preparingRes.json(),
            ]);
            const combined = [
                ...(pendingData.fulfillments ?? []),
                ...(preparingData.fulfillments ?? []),
            ];
            setTickets(combined.sort((a, b) => a.createdAt - b.createdAt));
        } finally {
            setLoading(false);
        }
    }, [storeId, branchId]);

    useEffect(() => {
        fetchTickets();
        // KDS refreshes every 15 seconds for near real-time updates
        const interval = setInterval(fetchTickets, 15000);
        return () => clearInterval(interval);
    }, [fetchTickets]);

    const handleAdvance = async (f: OrderFulfillment) => {
        const nextMap: Partial<Record<FulfillmentStatus, FulfillmentStatus>> = {
            PENDING: "PREPARING",
            PREPARING: "READY",
        };
        const next = nextMap[f.status];
        if (!next) return;

        setAdvancing(f.id);
        try {
            await fetch(`/api/fulfillments/${f.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: next }),
            });
            await fetchTickets();
        } finally {
            setAdvancing(null);
        }
    };

    const pending = tickets.filter(t => t.status === "PENDING");
    const preparing = tickets.filter(t => t.status === "PREPARING");

    const TicketCard = ({ f }: { f: OrderFulfillment }) => {
        const isLoading = advancing === f.id;
        const isPending = f.status === "PENDING";
        const elapsed = Math.floor((Date.now() - f.createdAt) / 60000);

        return (
            <div className={`rounded-3xl p-6 flex flex-col gap-4 shadow-2xl border-2 transition-all ${
                isPending
                    ? "bg-amber-900/40 border-amber-500/60"
                    : "bg-blue-900/40 border-blue-500/60"
            }`}>
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white font-black text-2xl tracking-wide">
                            #{f.orderId.slice(-6).toUpperCase()}
                        </p>
                        <p className={`text-sm font-semibold mt-0.5 ${isPending ? "text-amber-400" : "text-blue-400"}`}>
                            {isPending ? "🕐 PENDIENTE" : "📦 PREPARANDO"}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className={`text-3xl font-black ${elapsed > 15 ? "text-red-400 animate-pulse" : "text-white/50"}`}>
                            {elapsed}m
                        </p>
                        <p className="text-white/40 text-xs">en cola</p>
                    </div>
                </div>

                {/* Customer */}
                {f.customerName && (
                    <div className="bg-white/5 rounded-2xl px-4 py-2">
                        <p className="text-white/80 text-base">👤 {f.customerName}</p>
                    </div>
                )}

                {/* Items — large and legible */}
                <ul className="space-y-2">
                    {f.items.map((item, i) => (
                        <li key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2">
                            <span className="text-white text-lg font-semibold">{item.name}</span>
                            <span className={`text-2xl font-black ml-4 ${isPending ? "text-amber-300" : "text-blue-300"}`}>
                                ×{item.quantity}
                            </span>
                        </li>
                    ))}
                </ul>

                {/* CTA Button — LARGE for touch */}
                <button
                    onClick={() => handleAdvance(f)}
                    disabled={isLoading}
                    className={`w-full py-5 rounded-2xl font-black text-xl transition-all active:scale-95 disabled:opacity-50 ${
                        isPending
                            ? "bg-amber-500 hover:bg-amber-400 text-amber-950"
                            : "bg-blue-500 hover:bg-blue-400 text-white"
                    }`}
                >
                    {isLoading
                        ? "⟳ Procesando..."
                        : isPending
                        ? "📦 Iniciar Preparación"
                        : "✅ Marcar como Listo"}
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-950 p-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    <h1 className="text-white font-black text-3xl">🍽️ Cocina / Bodega</h1>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                    {/* Branch filter */}
                    {branches.length > 0 && (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-white/50" />
                            <Select value={branchId} onValueChange={setBranchId}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white text-sm rounded-xl h-10 w-52 hover:bg-white/20">
                                    <SelectValue placeholder="Sucursal" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">🌐 Todas las sucursales</SelectItem>
                                    {branches.map(b => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-amber-400">
                        <span className="text-2xl font-black">{pending.length}</span>
                        <span className="text-sm">pendientes</span>
                    </div>
                    <div className="flex items-center gap-2 text-blue-400">
                        <span className="text-2xl font-black">{preparing.length}</span>
                        <span className="text-sm">preparando</span>
                    </div>
                    <button
                        onClick={fetchTickets}
                        disabled={loading}
                        className="bg-white/10 text-white text-sm px-4 py-2 rounded-xl"
                    >
                        {loading ? "⟳" : "⟳ Actualizar"}
                    </button>
                    <a href="/admin/fulfillments" className="text-white/40 text-sm hover:text-white/70 transition-colors">
                        ← Panel completo
                    </a>
                </div>
            </div>

            {tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <p className="text-6xl">😴</p>
                    <p className="text-white/40 text-xl font-semibold">Sin órdenes pendientes</p>
                    <p className="text-white/20 text-sm">Se actualizará automáticamente cada 15 segundos</p>
                </div>
            ) : (
                /* Two-column layout: PENDING left, PREPARING right */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h2 className="text-amber-400 font-bold text-lg mb-4 flex items-center gap-2">
                            🕐 Por Preparar
                            <span className="bg-amber-500/20 text-amber-300 text-sm px-3 py-0.5 rounded-full">{pending.length}</span>
                        </h2>
                        <div className="flex flex-col gap-4">
                            {pending.length === 0 && (
                                <p className="text-white/20 text-center py-10">Sin órdenes pendientes</p>
                            )}
                            {pending.map(f => <TicketCard key={f.id} f={f} />)}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-blue-400 font-bold text-lg mb-4 flex items-center gap-2">
                            📦 En Preparación
                            <span className="bg-blue-500/20 text-blue-300 text-sm px-3 py-0.5 rounded-full">{preparing.length}</span>
                        </h2>
                        <div className="flex flex-col gap-4">
                            {preparing.length === 0 && (
                                <p className="text-white/20 text-center py-10">Sin órdenes en preparación</p>
                            )}
                            {preparing.map(f => <TicketCard key={f.id} f={f} />)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
