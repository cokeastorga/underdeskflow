"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import {
    ChannelConnection,
    ChannelType,
    CHANNEL_DISPLAY,
    CHANNEL_STATUS_DISPLAY,
} from "@/types/channels";
import {
    Globe,
    Plus,
    RefreshCw,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Unplug,
    ShoppingBag,
    ArrowUpRight,
    Lock,
    Zap,
} from "lucide-react";
import { SumUpMigration } from "@/components/tenant/settings/SumUpMigration";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ── Available channels to connect ────────────────────────────────────────────

const AVAILABLE_CHANNELS: { type: ChannelType; comission: string; rateLimit: string }[] = [
    { type: "shopify", comission: "Varía por plan", rateLimit: "40 req/s" },
    { type: "woocommerce", comission: "Varía por plan", rateLimit: "Variable" },
    { type: "mercadolibre", comission: "~12% por venta", rateLimit: "200 req/min" },
    { type: "pedidosya", comission: "~25% por venta", rateLimit: "50 req/min" },
    { type: "tiendanube", comission: "Varía por plan", rateLimit: "180 req/min" },
    { type: "sumup" as any, comission: "Catálogo & Stock", rateLimit: "30 req/min" },
];

// ── Status dot component ──────────────────────────────────────────────────────

function StatusDot({ color }: { color: "green" | "yellow" | "red" | "gray" }) {
    const colors = {
        green: "bg-green-500 shadow-green-500/50",
        yellow: "bg-yellow-400 shadow-yellow-400/50",
        red: "bg-red-500 shadow-red-500/50",
        gray: "bg-zinc-500",
    };
    return (
        <span className={`inline-block w-2 h-2 rounded-full shadow-lg ${colors[color]}`} />
    );
}

// ── Enterprise Upgrade Prompt ─────────────────────────────────────────────────

function EnterpriseUpgradePrompt() {
    const router = useRouter();
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
            <div className="w-20 h-20 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
                <Lock className="w-9 h-9 text-violet-400" />
            </div>
            <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-semibold text-white">
                    Módulo Enterprise
                </h2>
                <p className="text-zinc-400 leading-relaxed">
                    La conexión a canales externos (Shopify, Mercado Libre, PedidosYa, etc.)
                    es exclusiva del plan <span className="text-violet-400 font-medium">Enterprise</span>.
                    Sincroniza inventario, precios y órdenes en tiempo real.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg text-sm">
                {[
                    "Sync bidireccional de stock",
                    "Órdenes consolidadas de todos los canales",
                    "Sin comisión en ventas externas",
                ].map((f) => (
                    <div key={f} className="flex items-center gap-2 bg-zinc-800/60 rounded-lg px-3 py-2 border border-zinc-700/50">
                        <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
                        <span className="text-zinc-300">{f}</span>
                    </div>
                ))}
            </div>

            <div className="flex gap-3">
                <Button
                    onClick={() => router.push("/tenant/billing")}
                    className="bg-violet-600 hover:bg-violet-500 text-white gap-2"
                >
                    <Zap className="w-4 h-4" />
                    Ver planes
                </Button>
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                    Volver
                </Button>
            </div>
        </div>
    );
}

// ── Connected Channel Card ─────────────────────────────────────────────────────

function ChannelCard({ conn }: { conn: ChannelConnection }) {
    const ch = CHANNEL_DISPLAY[conn.channelType];
    const st = CHANNEL_STATUS_DISPLAY[conn.status];
    const lastSync = conn.lastSyncAt
        ? new Date(conn.lastSyncAt).toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" })
        : "Nunca";

    return (
        <Card className="bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 transition-colors">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{ch.icon}</span>
                        <div>
                            <CardTitle className="text-base text-white">{ch.name}</CardTitle>
                            <CardDescription className="text-zinc-500 text-xs mt-0.5">
                                {conn.credentials.shopDomain ?? conn.credentials.externalStoreId ?? "—"}
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <StatusDot color={st.dot} />
                        <span className={`text-xs font-medium ${st.color}`}>{st.label}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-zinc-800/60 rounded-md py-2">
                        <p className="text-xs text-zinc-500">Productos</p>
                        <p className="text-sm font-semibold text-white">
                            {conn.stats?.totalProductsSynced ?? "—"}
                        </p>
                    </div>
                    <div className="bg-zinc-800/60 rounded-md py-2">
                        <p className="text-xs text-zinc-500">Órdenes</p>
                        <p className="text-sm font-semibold text-white">
                            {conn.stats?.totalOrdersSynced ?? "—"}
                        </p>
                    </div>
                    <div className="bg-zinc-800/60 rounded-md py-2">
                        <p className="text-xs text-zinc-500">Conflictos</p>
                        <p className={`text-sm font-semibold ${(conn.stats?.pendingConflicts ?? 0) > 0 ? "text-yellow-400" : "text-white"}`}>
                            {conn.stats?.pendingConflicts ?? 0}
                        </p>
                    </div>
                </div>

                {/* Last sync */}
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Clock className="w-3 h-3" />
                    <span>Último sync: {lastSync}</span>
                </div>

                {/* Error banner */}
                {conn.lastErrorMessage && conn.status === "ERROR" && (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-md p-2 text-xs text-red-400">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{conn.lastErrorMessage}</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-1">
                        <RefreshCw className="w-3 h-3" />
                        Sync ahora
                    </Button>
                    {(conn.stats?.pendingConflicts ?? 0) > 0 && (
                        <Button size="sm" variant="outline" className="h-7 text-xs border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {conn.stats!.pendingConflicts} conflicto{conn.stats!.pendingConflicts > 1 ? "s" : ""}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ── Add Channel Card ───────────────────────────────────────────────────────────

function AddChannelCard({
    channelType,
    comission,
    rateLimit,
    alreadyConnected,
}: {
    channelType: ChannelType;
    comission: string;
    rateLimit: string;
    alreadyConnected: boolean;
}) {
    const ch = CHANNEL_DISPLAY[channelType];

    return (
        <Card className={`bg-zinc-900/40 border-zinc-800 ${alreadyConnected ? "opacity-50" : "hover:border-zinc-600 transition-colors cursor-pointer"}`}>
            <CardContent className="p-4 flex items-center gap-4">
                <span className="text-3xl">{ch.icon}</span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{ch.name}</p>
                    <p className="text-xs text-zinc-500 truncate">
                        Comisión canal: {comission} · Límite API: {rateLimit}
                    </p>
                </div>
                {alreadyConnected ? (
                    <Badge variant="outline" className="border-green-500/40 text-green-400 text-xs shrink-0">
                        Conectado
                    </Badge>
                ) : (
                    <Button size="sm" className="h-7 text-xs bg-zinc-800 hover:bg-zinc-700 text-white gap-1 shrink-0">
                        <Plus className="w-3 h-3" />
                        Conectar
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ChannelsPage() {
    const { user, storeId, loading } = useAuth() as any;
    const [connections, setConnections] = useState<ChannelConnection[]>([]);
    const [fetching, setFetching] = useState(true);

    // For now, read plan from store doc (to be replaced with useStorePlan hook)
    const [plan, setPlan] = useState<string>("basic");

    useEffect(() => {
        if (!storeId) return;

        // Fetch store plan
        import("@/lib/firebase/config").then(({ db }) => {
            import("firebase/firestore").then(({ doc, getDoc }) => {
                getDoc(doc(db, "stores", storeId)).then(snap => {
                    if (snap.exists()) setPlan(snap.data().plan ?? "basic");
                });
            });
        });

        // Fetch channel connections
        const colRef = collection(db, "stores", storeId, "channel_connections");
        getDocs(query(colRef, orderBy("createdAt", "desc")))
            .then(snap => {
                setConnections(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChannelConnection)));
            })
            .finally(() => setFetching(false));
    }, [storeId]);

    if (loading || fetching) {
        return (
            <div className="p-6 space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-zinc-800/50 rounded-xl" />
                ))}
            </div>
        );
    }

    // Gate: Enterprise only
    if (plan !== "enterprise") {
        return <EnterpriseUpgradePrompt />;
    }

    const connectedTypes = new Set(connections.map(c => c.channelType));
    const activeConnections = connections.filter(c => c.status !== "DISCONNECTED");
    const errorCount = connections.filter(c => c.status === "ERROR").length;
    const conflictCount = connections.reduce((sum, c) => sum + (c.stats?.pendingConflicts ?? 0), 0);

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8">
            {/* SumUp Migration Section (Internal tool for catalogue import) */}
            <div className="mb-8">
                <SumUpMigration storeId={storeId} />
            </div>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
                        <Globe className="w-6 h-6 text-violet-400" />
                        Canales externos
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1">
                        Sincronización bidireccional de inventario, precios y órdenes con portales externos.
                        Las ventas en canales externos <strong className="text-zinc-300">no generan comisión de plataforma</strong>.
                    </p>
                </div>
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">
                    Plan Enterprise
                </Badge>
            </div>

            {/* Summary banners */}
            {(errorCount > 0 || conflictCount > 0) && (
                <div className="flex flex-wrap gap-3">
                    {errorCount > 0 && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-sm text-red-400">
                            <AlertTriangle className="w-4 h-4" />
                            {errorCount} canal{errorCount > 1 ? "es" : ""} con error — requiere atención
                        </div>
                    )}
                    {conflictCount > 0 && (
                        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-sm text-yellow-400">
                            <AlertTriangle className="w-4 h-4" />
                            {conflictCount} conflicto{conflictCount > 1 ? "s" : ""} de precio/stock pendiente{conflictCount > 1 ? "s" : ""}
                        </div>
                    )}
                </div>
            )}

            {/* Connected channels */}
            {activeConnections.length > 0 && (
                <section>
                    <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
                        Canales conectados ({activeConnections.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeConnections.map(conn => (
                            <ChannelCard key={conn.id} conn={conn} />
                        ))}
                    </div>
                </section>
            )}

            {/* Available channels to connect */}
            <section>
                <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
                    Canales disponibles
                </h2>
                <div className="space-y-2">
                    {AVAILABLE_CHANNELS.map(ch => (
                        <AddChannelCard
                            key={ch.type}
                            channelType={ch.type}
                            comission={ch.comission}
                            rateLimit={ch.rateLimit}
                            alreadyConnected={connectedTypes.has(ch.type)}
                        />
                    ))}
                </div>
            </section>

            {/* Info note */}
            <div className="flex items-start gap-3 bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-4 text-sm text-zinc-400">
                <ShoppingBag className="w-4 h-4 mt-0.5 text-zinc-500 shrink-0" />
                <div className="space-y-1">
                    <p>
                        <strong className="text-zinc-300">Regla de comisión:</strong>{" "}
                        La plataforma aplica un fee del 8% únicamente a ventas realizadas en tu tienda propia.
                        Las ventas en Mercado Libre, Shopify y otros portales externos son 100% tuyas —
                        solo pagas la comisión del portal correspondiente.
                    </p>
                    <a
                        href="/tenant/billing"
                        className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 text-xs mt-1"
                    >
                        Ver detalles de tu plan <ArrowUpRight className="w-3 h-3" />
                    </a>
                </div>
            </div>
        </div>
    );
}
