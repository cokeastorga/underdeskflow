"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
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

// ... (COLUMNS, NEXT_STATUS, TYPE_LABEL, FulfillmentCard remain identical below)

const COLUMNS: { status: FulfillmentStatus; label: string; color: string; icon: string }[] = [
    { status: "PENDING",         label: "Pendiente",       color: "from-slate-500 to-slate-700",   icon: "🕐" },
    { status: "PREPARING",       label: "Preparando",      color: "from-amber-500 to-amber-700",   icon: "📦" },
    { status: "READY",           label: "Listo",           color: "from-blue-500 to-blue-700",     icon: "✅" },
    { status: "OUT_FOR_DELIVERY",label: "En Camino",       color: "from-purple-500 to-purple-700", icon: "🛵" },
    { status: "SHIPPED",         label: "Enviado",         color: "from-indigo-500 to-indigo-700", icon: "🚚" },
    { status: "DELIVERED",       label: "Entregado",       color: "from-emerald-500 to-emerald-700", icon: "🎉" },
];

const NEXT_STATUS: Partial<Record<FulfillmentStatus, FulfillmentStatus>> = {
    PENDING:          "PREPARING",
    PREPARING:        "READY",
    READY:            "OUT_FOR_DELIVERY",
    OUT_FOR_DELIVERY: "DELIVERED",
    SHIPPED:          "DELIVERED",
};

const TYPE_LABEL: Record<string, string> = {
    PICKUP:         "🏪 Retiro en tienda",
    LOCAL_DELIVERY: "🛵 Despacho local",
    THIRD_PARTY:    "📮 Courier externo",
};

function FulfillmentCard({
    f,
    onAdvance,
    loading,
}: {
    f: OrderFulfillment;
    onAdvance: (id: string, next: FulfillmentStatus) => void;
    loading: string | null;
}) {
    const next = NEXT_STATUS[f.status];
    const isLoading = loading === f.id;

    return (
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 flex flex-col gap-3 transition-all hover:border-white/40 hover:shadow-xl">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-white font-semibold text-sm truncate">#{f.orderId.slice(-8).toUpperCase()}</p>
                    <p className="text-white/60 text-xs mt-0.5">{TYPE_LABEL[f.fulfillmentType] ?? f.fulfillmentType}</p>
                </div>
                <span className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded-full whitespace-nowrap">
                    {f.items.length} ítem{f.items.length !== 1 ? "s" : ""}
                </span>
            </div>

            {f.customerName && (
                <p className="text-white/80 text-sm">👤 {f.customerName}</p>
            )}

            <ul className="space-y-1">
                {f.items.slice(0, 3).map((item, i) => (
                    <li key={i} className="text-white/60 text-xs flex justify-between">
                        <span className="truncate">{item.name}</span>
                        <span className="ml-2 font-mono">×{item.quantity}</span>
                    </li>
                ))}
                {f.items.length > 3 && (
                    <li className="text-white/40 text-xs">+{f.items.length - 3} más...</li>
                )}
            </ul>

            {next && (
                <button
                    onClick={() => onAdvance(f.id, next)}
                    disabled={isLoading}
                    className="mt-auto w-full text-xs font-semibold bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white rounded-xl py-2 transition-all"
                >
                    {isLoading ? "Actualizando..." : `Avanzar → ${COLUMNS.find(c => c.status === next)?.label ?? next}`}
                </button>
            )}

            {f.status === "DELIVERED" && (
                <span className="text-center text-emerald-300 text-xs font-semibold">¡Entregado! 🎉</span>
            )}
        </div>
    );
}

interface Branch { id: string; name: string; }

// Extracted inner component that safely uses useSearchParams
function KanbanBoard() {
    const searchParams = useSearchParams();
    const storeId = searchParams.get("storeId") ?? undefined;

    const [fulfillments, setFulfillments] = useState<OrderFulfillment[]>([]);
    const [loading,      setLoading]      = useState(false);
    const [advancing,    setAdvancing]    = useState<string | null>(null);
    const [error,        setError]        = useState<string | null>(null);
    const [branches,     setBranches]     = useState<Branch[]>([]);
    const [branchId,     setBranchId]     = useState<string>("ALL");

    // Load branches once
    useEffect(() => {
        if (!storeId) return;
        fetch(`/api/store/branches?storeId=${storeId}`)
            .then(r => r.json())
            .then(data => setBranches((data.branches ?? []).filter((b: Branch & { isActive?: boolean }) => b.isActive !== false)))
            .catch(() => {});
    }, [storeId]);

    const fetchFulfillments = useCallback(async () => {
        if (!storeId) return;
        setLoading(true);
        try {
            const params = new URLSearchParams({ storeId });
            if (branchId !== "ALL") params.set("branchId", branchId);
            const res = await fetch(`/api/fulfillments?${params.toString()}`);
            const data = await res.json();
            setFulfillments(data.fulfillments ?? []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [storeId, branchId]);

    useEffect(() => {
        fetchFulfillments();
        const interval = setInterval(fetchFulfillments, 30000); // auto-refresh every 30s
        return () => clearInterval(interval);
    }, [fetchFulfillments]);

    const handleAdvance = useCallback(async (id: string, next: FulfillmentStatus) => {
        setAdvancing(id);
        try {
            const res = await fetch(`/api/fulfillments/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: next }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error ?? "Error desconocido");
            }
            await fetchFulfillments();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setAdvancing(null);
        }
    }, [fetchFulfillments]);

    const byStatus = (status: FulfillmentStatus) =>
        fulfillments.filter(f => f.status === status);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">📦 Panel de Despachos</h1>
                    <p className="text-white/50 mt-1 text-sm">Gestión logística de órdenes en tiempo real</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Branch filter */}
                    {branches.length > 0 && (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-white/50" />
                            <Select value={branchId} onValueChange={setBranchId}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white text-sm rounded-xl h-9 w-52 hover:bg-white/20">
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
                    <span className="text-white/40 text-sm">{fulfillments.length} despachos</span>
                    <button
                        onClick={fetchFulfillments}
                        disabled={loading}
                        className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-2 rounded-xl transition-all"
                    >
                        {loading ? "⟳ Actualizando..." : "⟳ Refrescar"}
                    </button>
                    <a
                        href="/admin/kds"
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
                    >
                        🍽️ Vista Cocina (KDS)
                    </a>
                </div>
            </div>

            {error && (
                <div className="mb-4 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl px-4 py-3 text-sm">
                    ⚠️ {error}
                    <button onClick={() => setError(null)} className="ml-2 underline">Cerrar</button>
                </div>
            )}

            {/* Kanban Columns */}
            <div className="flex gap-4 overflow-x-auto pb-4">
                {COLUMNS.map(col => (
                    <div
                        key={col.status}
                        className="flex-shrink-0 w-72"
                    >
                        {/* Column Header */}
                        <div className={`bg-gradient-to-br ${col.color} rounded-2xl p-3 mb-3 flex items-center justify-between`}>
                            <span className="text-white font-bold text-sm">
                                {col.icon} {col.label}
                            </span>
                            <span className="bg-black/20 text-white text-xs font-mono px-2 py-0.5 rounded-full">
                                {byStatus(col.status).length}
                            </span>
                        </div>

                        {/* Cards */}
                        <div className={`bg-gradient-to-br ${col.color} bg-opacity-20 rounded-2xl p-3 min-h-32 flex flex-col gap-3`}>
                            {byStatus(col.status).length === 0 ? (
                                <div className="text-white/30 text-center text-xs py-6">
                                    Sin despachos
                                </div>
                            ) : (
                                byStatus(col.status).map(f => (
                                    <FulfillmentCard
                                        key={f.id}
                                        f={f}
                                        onAdvance={handleAdvance}
                                        loading={advancing}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function FulfillmentsKanbanPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 flex items-center justify-center p-6 text-white text-xl">
                Cargando tablero Kanban...
            </div>
        }>
            <KanbanBoard />
        </Suspense>
    );
}
