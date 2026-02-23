"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import {
    collection, query, where, getDocs, orderBy,
    Timestamp, getDoc, doc
} from "firebase/firestore";
import {
    BarChart2, TrendingUp, TrendingDown, ShoppingCart, Users,
    DollarSign, Package, ArrowUpRight, ArrowDownRight,
    Globe, Store, Percent, AlertTriangle, Layers
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CHANNEL_DISPLAY } from "@/types/channels";

// ─── Types ────────────────────────────────────────────────────────────────────

interface KpiData {
    totalRevenue: number;
    ownStoreRevenue: number;
    externalRevenue: number;
    totalOrders: number;
    ownStoreOrders: number;
    externalOrders: number;
    aov: number;
    customers: number;
    revenueChange: number;
    ordersChange: number;
    platformFeeCollected: number;   // 8% on own-store
    channelCommissionsPaid: number; // Sum of channel commissions (ML, PedidosYa, etc.)
}

interface ChannelBreakdown {
    channelType: string;
    label: string;
    emoji: string;
    revenue: number;
    orders: number;
    commission: number;
    platformFee: number;
}

interface TopProduct { name: string; revenue: number; units: number; }
interface RevenuePoint { month: string; ownStore: number; external: number; }

const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// ─── Formatters ───────────────────────────────────────────────────────────────

const clp = (v: number) => `$${Math.round(v).toLocaleString("es-CL")}`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
    const { storeId } = useAuth();
    const router = useRouter();

    const [storePlan, setStorePlan] = useState<string>("basic");
    const [kpi, setKpi] = useState<KpiData>({
        totalRevenue: 0, ownStoreRevenue: 0, externalRevenue: 0,
        totalOrders: 0, ownStoreOrders: 0, externalOrders: 0,
        aov: 0, customers: 0, revenueChange: 0, ordersChange: 0,
        platformFeeCollected: 0, channelCommissionsPaid: 0,
    });
    const [channelBreakdown, setChannelBreakdown] = useState<ChannelBreakdown[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [chartData, setChartData] = useState<RevenuePoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "channels" | "fees">("overview");

    const [funnel] = useState([
        { label: "Visitantes únicos", val: 12840, pct: 100 },
        { label: "Vieron un producto", val: 7704, pct: 60 },
        { label: "Agregaron al carrito", val: 2183, pct: 17 },
        { label: "Iniciaron checkout", val: 1091, pct: 8.5 },
        { label: "Compraron", val: 488, pct: 3.8 },
    ]);

    useEffect(() => {
        if (!storeId) return;
        getDoc(doc(db, "stores", storeId)).then(snap => {
            if (snap.exists()) setStorePlan(snap.data().plan ?? "basic");
        });
        load();
    }, [storeId]);

    async function load() {
        if (!storeId) return;
        setLoading(true);
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

            // All orders in this store (nested subcollection: stores/{id}/orders)
            const ordersRef = collection(db, "stores", storeId, "orders");

            const [thisMonthSnap, lastMonthSnap, sixMonthSnap] = await Promise.all([
                getDocs(query(ordersRef, where("createdAt", ">=", Timestamp.fromDate(startOfMonth)), orderBy("createdAt", "desc"))),
                getDocs(query(ordersRef, where("createdAt", ">=", Timestamp.fromDate(startOfLastMonth)), where("createdAt", "<", Timestamp.fromDate(startOfMonth)))),
                getDocs(query(ordersRef, where("createdAt", ">=", Timestamp.fromDate(sixMonthsAgo)), orderBy("createdAt", "asc"))),
            ]);

            const thisMonthOrders = thisMonthSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
            const lastMonthRevenue = lastMonthSnap.docs.reduce((s, d) => s + (d.data().total || 0), 0);

            // Split by source
            const ownOrders = thisMonthOrders.filter((o: any) => o.source !== "EXTERNAL_CHANNEL");
            const extOrders = thisMonthOrders.filter((o: any) => o.source === "EXTERNAL_CHANNEL");

            const ownRevenue = ownOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
            const extRevenue = extOrders.reduce((s: number, o: any) => s + (o.total || 0), 0);
            const totalRevenue = ownRevenue + extRevenue;
            const platformFee = Math.round(ownRevenue * 0.08);
            const channelCommissions = extOrders.reduce((s: number, o: any) => s + (o.channelCommission || 0), 0);

            // Channel breakdown (group external orders by channelType)
            const channelMap: Record<string, ChannelBreakdown> = {};
            // Own store entry
            channelMap["own_store"] = {
                channelType: "own_store",
                label: "Tienda propia",
                emoji: "🏪",
                revenue: ownRevenue,
                orders: ownOrders.length,
                commission: 0,
                platformFee,
            };
            extOrders.forEach((o: any) => {
                const ct = o.channelType ?? "unknown";
                const display = CHANNEL_DISPLAY[ct as keyof typeof CHANNEL_DISPLAY];
                if (!channelMap[ct]) {
                    channelMap[ct] = {
                        channelType: ct,
                        label: display?.name ?? ct,
                        emoji: display?.icon ?? "🌐",
                        revenue: 0, orders: 0, commission: 0, platformFee: 0,
                    };
                }
                channelMap[ct].revenue += o.total || 0;
                channelMap[ct].orders += 1;
                channelMap[ct].commission += o.channelCommission || 0;
            });
            setChannelBreakdown(Object.values(channelMap).sort((a, b) => b.revenue - a.revenue));

            // 6-month chart
            const byMonth: Record<string, { own: number; ext: number }> = {};
            sixMonthSnap.docs.forEach(d => {
                const data = d.data();
                const date = (data.createdAt as Timestamp).toDate();
                const key = `${date.getFullYear()}-${date.getMonth()}`;
                if (!byMonth[key]) byMonth[key] = { own: 0, ext: 0 };
                if (data.source === "EXTERNAL_CHANNEL") {
                    byMonth[key].ext += data.total || 0;
                } else {
                    byMonth[key].own += data.total || 0;
                }
            });
            const chart: RevenuePoint[] = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${d.getFullYear()}-${d.getMonth()}`;
                chart.push({ month: MONTHS_ES[d.getMonth()], ownStore: byMonth[key]?.own ?? 0, external: byMonth[key]?.ext ?? 0 });
            }
            setChartData(chart);

            // Top products
            const productTotals: Record<string, { name: string; revenue: number; units: number }> = {};
            sixMonthSnap.docs.forEach(d => {
                const items: any[] = d.data().items || [];
                items.forEach(item => {
                    const pid = item.productId || item.name;
                    if (!productTotals[pid]) productTotals[pid] = { name: item.name || pid, revenue: 0, units: 0 };
                    productTotals[pid].revenue += (item.price || 0) * (item.quantity || 1);
                    productTotals[pid].units += item.quantity || 1;
                });
            });
            setTopProducts(Object.values(productTotals).sort((a, b) => b.revenue - a.revenue).slice(0, 5));

            const uniqueCustomers = new Set(thisMonthOrders.map((o: any) => o.customerId || o.customerEmail)).size;

            setKpi({
                totalRevenue, ownStoreRevenue: ownRevenue, externalRevenue: extRevenue,
                totalOrders: thisMonthOrders.length, ownStoreOrders: ownOrders.length, externalOrders: extOrders.length,
                aov: thisMonthOrders.length > 0 ? totalRevenue / thisMonthOrders.length : 0,
                customers: uniqueCustomers,
                revenueChange: lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0,
                ordersChange: lastMonthSnap.size > 0 ? ((thisMonthOrders.length - lastMonthSnap.size) / lastMonthSnap.size) * 100 : 0,
                platformFeeCollected: platformFee,
                channelCommissionsPaid: channelCommissions,
            });
        } catch (err) {
            console.error("Analytics load error:", err);
        } finally {
            setLoading(false);
        }
    }

    const maxChart = Math.max(...chartData.map(d => d.ownStore + d.external), 1);
    const isEnterprise = storePlan === "enterprise";

    // ── Sub-components ────────────────────────────────────────────────────────

    const KpiCard = ({ icon: Icon, label, value, change, prefix = "", badge }: {
        icon: any; label: string; value: number; change?: number; prefix?: string; badge?: string;
    }) => (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                    </div>
                </div>
                <p className="text-xl font-bold">{loading ? "—" : `${prefix}${Math.round(value).toLocaleString("es-CL")}`}</p>
                <div className="flex items-center justify-between mt-1">
                    {change !== undefined && !loading && (
                        <span className={`flex items-center gap-0.5 text-xs font-semibold ${change >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(change).toFixed(1)}% vs mes anterior
                        </span>
                    )}
                    {badge && <Badge variant="secondary" className="text-[10px] px-1">{badge}</Badge>}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <BarChart2 className="h-5 w-5 text-indigo-500" />
                        </div>
                        Analytics
                        {isEnterprise && (
                            <Badge className="bg-violet-500/20 text-violet-400 border border-violet-500/30 text-xs">
                                Multicanal
                            </Badge>
                        )}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">Rendimiento consolidado — todas las fuentes de venta, mes actual.</p>
                </div>
                {isEnterprise && (
                    <Button variant="outline" size="sm" onClick={() => router.push("/tenant/channels")}>
                        <Globe className="h-4 w-4 mr-2" />
                        Gestionar canales
                    </Button>
                )}
            </div>

            {/* Tabs (Enterprise shows channels + fees) */}
            <div className="flex gap-1 border-b pb-0">
                {[
                    { id: "overview", label: "Resumen", icon: Layers },
                    ...(isEnterprise ? [
                        { id: "channels", label: "Canales", icon: Globe },
                        { id: "fees", label: "Comisiones y fees", icon: Percent },
                    ] : []),
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                            ? "border-primary text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── OVERVIEW TAB ── */}
            {activeTab === "overview" && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard icon={DollarSign} label="Revenue total" value={kpi.totalRevenue} change={kpi.revenueChange} prefix="$" />
                        <KpiCard icon={ShoppingCart} label="Órdenes" value={kpi.totalOrders} change={kpi.ordersChange} />
                        <KpiCard icon={TrendingUp} label="Ticket promedio" value={kpi.aov} prefix="$" />
                        <KpiCard icon={Users} label="Clientes únicos" value={kpi.customers} />
                    </div>

                    {isEnterprise && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <KpiCard icon={Store} label="Revenue tienda propia" value={kpi.ownStoreRevenue} prefix="$" badge={`${kpi.ownStoreOrders} órdenes`} />
                            <KpiCard icon={Globe} label="Revenue canales externos" value={kpi.externalRevenue} prefix="$" badge={`${kpi.externalOrders} órdenes`} />
                            <KpiCard icon={Percent} label="Fee plataforma (8%)" value={kpi.platformFeeCollected} prefix="$" badge="tienda propia" />
                            <KpiCard icon={AlertTriangle} label="Comisiones canales" value={kpi.channelCommissionsPaid} prefix="$" badge="info" />
                        </div>
                    )}

                    {/* Stacked Revenue Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Revenue mensual — últimos 6 meses</CardTitle>
                            <CardDescription>
                                {isEnterprise ? "Apilado: tienda propia (azul) + canales externos (violeta)" : "Suma de órdenes pagadas por mes"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">Cargando datos...</div>
                            ) : (
                                <div className="h-52 flex items-end justify-between gap-2 relative">
                                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                        {[1, 0.75, 0.5, 0.25, 0].map(pct => (
                                            <div key={pct} className="border-t border-dashed border-border/40 w-full" />
                                        ))}
                                    </div>
                                    {chartData.map((point, i) => {
                                        const totalH = ((point.ownStore + point.external) / maxChart) * 100;
                                        const extH = totalH > 0 ? (point.external / (point.ownStore + point.external)) * totalH : 0;
                                        const ownH = totalH - extH;
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1 relative z-10">
                                                <div className="w-full flex flex-col" style={{ height: `${totalH}%`, minHeight: totalH > 0 ? "4px" : "0" }}>
                                                    {isEnterprise && extH > 0 && (
                                                        <div className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-violet-400 transition-all duration-700" style={{ height: `${extH}%` }} />
                                                    )}
                                                    <div className={`w-full bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-700 ${!isEnterprise || extH === 0 ? "rounded-t-lg" : ""}`}
                                                        style={{ height: `${ownH}%`, minHeight: ownH > 0 ? "2px" : "0" }} />
                                                </div>
                                                <p className="text-xs text-muted-foreground">{point.month}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {isEnterprise && (
                                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-indigo-500 inline-block" /> Tienda propia</span>
                                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-violet-500 inline-block" /> Canales externos</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Top Products */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Top Productos por Revenue
                                </CardTitle>
                                <CardDescription>Basado en órdenes de los últimos 6 meses</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loading ? (
                                    <p className="text-sm text-muted-foreground">Cargando...</p>
                                ) : topProducts.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-8 text-center">
                                        Sin datos de ítems aún. Los datos aparecerán una vez que tengas ventas con productos.
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {topProducts.map((p, i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <span className="text-xs font-mono text-muted-foreground w-5 text-right">{i + 1}</span>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-sm font-medium">{p.name}</p>
                                                        <span className="text-sm font-semibold">{clp(p.revenue)}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500"
                                                            style={{ width: `${(p.revenue / topProducts[0].revenue) * 100}%` }} />
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="text-xs shrink-0">{p.units} uds.</Badge>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Conversion Funnel */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Funnel de conversión</CardTitle>
                                <CardDescription>Últimos 30 días (tienda propia)</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {funnel.map((step, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-muted-foreground">{step.label}</span>
                                            <span className="font-semibold">{step.val.toLocaleString("es-CL")}</span>
                                        </div>
                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full rounded-full bg-indigo-500 transition-all duration-700" style={{ width: `${step.pct}%` }} />
                                        </div>
                                        <p className="text-right text-[10px] text-muted-foreground mt-0.5">{step.pct}%</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* ── CHANNELS TAB (Enterprise only) ── */}
            {activeTab === "channels" && isEnterprise && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Revenue y órdenes por fuente de venta — mes actual.</p>
                    {loading ? (
                        <div className="text-sm text-muted-foreground">Cargando...</div>
                    ) : channelBreakdown.length === 0 ? (
                        <Card className="p-8 text-center">
                            <Globe className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                            <p className="font-medium">Sin datos multicanal aún</p>
                            <p className="text-sm text-muted-foreground mt-1">Conecta canales externos para ver el desglose aquí.</p>
                            <Button size="sm" className="mt-4" onClick={() => router.push("/tenant/channels")}>
                                Conectar canales
                            </Button>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {channelBreakdown.map(ch => {
                                const totalAll = channelBreakdown.reduce((s, c) => s + c.revenue, 0);
                                const share = totalAll > 0 ? (ch.revenue / totalAll) * 100 : 0;
                                return (
                                    <Card key={ch.channelType}>
                                        <CardContent className="p-5">
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl">{ch.emoji}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="font-semibold text-sm">{ch.label}</p>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs text-muted-foreground">{ch.orders} órdenes</span>
                                                            <span className="font-bold text-sm">{clp(ch.revenue)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-700 ${ch.channelType === "own_store" ? "bg-indigo-500" : "bg-violet-500"}`}
                                                            style={{ width: `${share}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between mt-1">
                                                        <span className="text-[10px] text-muted-foreground">{share.toFixed(1)}% del total</span>
                                                        {ch.channelType === "own_store" ? (
                                                            <span className="text-[10px] text-indigo-500">Fee plataforma: {clp(ch.platformFee)} (8%)</span>
                                                        ) : (
                                                            <span className="text-[10px] text-amber-500">Comisión canal: {clp(ch.commission)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ── FEES TAB (Enterprise only) ── */}
            {activeTab === "fees" && isEnterprise && (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Desglose de fees y comisiones — mes actual.</p>
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Platform fee summary */}
                        <Card className="border-indigo-500/30 bg-indigo-500/5">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Store className="h-4 w-4 text-indigo-500" />
                                    Fee de plataforma (tienda propia)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Revenue tienda propia</span>
                                    <span className="font-semibold">{loading ? "—" : clp(kpi.ownStoreRevenue)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tasa fee_venta</span>
                                    <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">8%</Badge>
                                </div>
                                <div className="border-t pt-3 flex justify-between font-bold">
                                    <span>Fee cobrado por plataforma</span>
                                    <span className="text-indigo-500">{loading ? "—" : clp(kpi.platformFeeCollected)}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Channel commissions */}
                        <Card className="border-amber-500/30 bg-amber-500/5">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-amber-500" />
                                    Comisiones de canales externos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Revenue canales externos</span>
                                    <span className="font-semibold">{loading ? "—" : clp(kpi.externalRevenue)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Fee plataforma canales</span>
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">0%</Badge>
                                </div>
                                <div className="border-t pt-3 flex justify-between font-bold">
                                    <span>Comisiones pagadas a canales</span>
                                    <span className="text-amber-500">{loading ? "—" : clp(kpi.channelCommissionsPaid)}</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Las comisiones de canales (ML ~13%, PedidosYa ~25%) son cobradas directamente por el canal — la plataforma no cobra sobre estas ventas.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Net benefit table */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Resumen neto del mes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-xs text-muted-foreground">
                                        <th className="pb-2 font-medium">Concepto</th>
                                        <th className="pb-2 font-medium text-right">Monto</th>
                                        <th className="pb-2 font-medium text-right">Nota</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {[
                                        { label: "Revenue tienda propia", amount: clp(kpi.ownStoreRevenue), note: "100% fluye a tu cuenta" },
                                        { label: "Fee plataforma (8%)", amount: `-${clp(kpi.platformFeeCollected)}`, note: "Descontado del pago" },
                                        { label: "Neto tienda propia", amount: clp(kpi.ownStoreRevenue - kpi.platformFeeCollected), note: "(92% de revenue propio)" },
                                        { label: "Revenue canales externos", amount: clp(kpi.externalRevenue), note: "0% fee de plataforma" },
                                        { label: "Comisiones pagadas a canales", amount: `-${clp(kpi.channelCommissionsPaid)}`, note: "Cobrado por ML, PY, etc." },
                                        { label: "Neto canales externos", amount: clp(kpi.externalRevenue - kpi.channelCommissionsPaid), note: "" },
                                    ].map((row, i) => (
                                        <tr key={i} className={i === 2 || i === 5 ? "bg-muted/30 font-semibold" : ""}>
                                            <td className="py-2 pr-4">{row.label}</td>
                                            <td className="py-2 text-right font-mono">{loading ? "—" : row.amount}</td>
                                            <td className="py-2 text-right text-xs text-muted-foreground">{row.note}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Non-Enterprise upgrade prompt for channels/fees */}
            {!isEnterprise && (
                <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-transparent">
                    <CardContent className="p-6 flex items-start gap-4">
                        <Globe className="h-8 w-8 text-violet-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-semibold">Analytics Multicanal — disponible en Enterprise</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Activa el plan Enterprise para ver revenue desglosado por canal (Shopify, Mercado Libre, PedidosYa, etc.),
                                análisis de comisiones, y el impacto del fee 0% en ventas externas.
                            </p>
                        </div>
                        <Button size="sm" variant="outline" className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10 shrink-0"
                            onClick={() => router.push("/tenant/billing")}>
                            Ver planes
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
