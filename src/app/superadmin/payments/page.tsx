import { getSuperAdminAnalytics } from "@/domains/analytics/services.server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, CheckCircle2, Store, AlertCircle } from "lucide-react";

function fmt(n: number) {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(n);
}

function fmtDate(ts: any) {
    if (!ts) return "—";
    const ms = typeof ts === "number" ? ts : ts?.toMillis?.() ?? Date.now();
    return new Date(ms).toLocaleString("es-CL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const STATUS_CLASS: Record<string, string> = {
    PAID:      "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    approved:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    PENDING:   "bg-amber-500/10  text-amber-400  border-amber-500/30",
    FAILED:    "bg-red-500/10    text-red-400    border-red-500/30",
};

export default async function SuperAdminPaymentsPage() {
    const analytics = await getSuperAdminAnalytics();

    const kpis = [
        { icon: DollarSign,  label: "GMV Global",          value: fmt(analytics.globalGmv),          color: "from-violet-600 to-indigo-600" },
        { icon: TrendingUp,  label: "Cuota Plataforma (8%)",value: fmt(analytics.globalPlatformFees), color: "from-emerald-600 to-teal-600"  },
        { icon: CheckCircle2,label: "Transacciones Recientes",value: String(analytics.totalOrders),   color: "from-blue-600 to-cyan-600"     },
        { icon: Store,       label: "Tiendas con Actividad", value: String(analytics.activeStores),   color: "from-amber-600 to-orange-600"  },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Auditoría de Pagos</h1>
                <p className="text-zinc-400 mt-1.5">Ledger global de transacciones y comisiones UDF</p>
            </div>

            {/* Alerts: disconnected tenants */}
            {analytics.storesMissingMp.length > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25">
                    <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-amber-300">
                            {analytics.storesMissingMp.length} tienda{analytics.storesMissingMp.length > 1 ? "s" : ""} sin Mercado Pago conectado
                        </p>
                        <p className="text-xs text-amber-400/70 mt-0.5">
                            {analytics.storesMissingMp.map((s: any) => s.name).join(", ")}
                        </p>
                    </div>
                </div>
            )}

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(kpi => (
                    <Card key={kpi.label} className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-5">
                            <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center mb-3 shadow-lg`}>
                                <kpi.icon className="h-4.5 w-4.5 text-white h-5 w-5" />
                            </div>
                            <p className="text-xs text-zinc-500 font-medium">{kpi.label}</p>
                            <p className="text-2xl font-black text-white mt-1">{kpi.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Payment Ledger */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="border-b border-zinc-800 pb-4">
                    <CardTitle className="text-white text-base">Últimos pagos globales</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {analytics.latestPayments.length === 0 ? (
                        <div className="py-16 text-center text-zinc-500">
                            <DollarSign className="h-10 w-10 mx-auto opacity-20 mb-3" />
                            <p className="text-sm">Sin transacciones registradas todavía.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-800 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                                        <th className="text-left py-3 px-6">Tenant</th>
                                        <th className="text-left py-3 px-4">PSP</th>
                                        <th className="text-right py-3 px-4">Monto</th>
                                        <th className="text-right py-3 px-4">Fee (8%)</th>
                                        <th className="text-left py-3 px-4">Estado</th>
                                        <th className="text-right py-3 px-6">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/60">
                                    {analytics.latestPayments.map((p: any, i: number) => (
                                        <tr key={i} className="hover:bg-zinc-800/40 transition-colors">
                                            <td className="py-3.5 px-6 font-mono text-xs text-zinc-400">{p.storeId?.slice(0, 14)}…</td>
                                            <td className="py-3.5 px-4">
                                                <Badge variant="outline" className="text-[10px] bg-zinc-800 border-zinc-700 text-zinc-300 capitalize">
                                                    {p.provider}
                                                </Badge>
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-bold text-white">{fmt(p.amount)}</td>
                                            <td className="py-3.5 px-4 text-right font-semibold text-emerald-400">+{fmt(p.platformFee)}</td>
                                            <td className="py-3.5 px-4">
                                                <Badge variant="outline" className={`text-[10px] border ${STATUS_CLASS[p.status] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                                                    {p.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3.5 px-6 text-right text-xs text-zinc-500">{fmtDate(p.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
