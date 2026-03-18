import { getAllSubscriptions } from "@/domains/subscriptions/services.server";
import { PLANS } from "@/domains/subscriptions/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Landmark, Users, CreditCard, Calendar, ArrowUpRight, TrendingUp, DollarSign } from "lucide-react";
import { getSuperAdminAnalytics } from "@/domains/analytics/services.server";

function fmtDate(ms: number) {
    if (!ms) return "N/A";
    return new Intl.DateTimeFormat("es-CL", { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(ms));
}

function fmtCurrency(val: number) {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(val);
}

export default async function SuperAdminBillingPage() {
    const [subscriptions, analytics] = await Promise.all([
        getAllSubscriptions(),
        getSuperAdminAnalytics()
    ]);

    const activeCount = subscriptions.filter(s => s.status === "active").length;
    const saasMrr = subscriptions.reduce((acc, s) => {
        const plan = PLANS[s.planId];
        return s.status === "active" ? acc + (plan?.monthlyPrice || 0) : acc;
    }, 0);

    const stats = [
        { label: "Suscripciones SaaS (MRR)", value: fmtCurrency(saasMrr), icon: Users, color: "text-blue-400", sub: `${activeCount} tiendas pagando` },
        { label: "Recaudación Fees (8%)", value: fmtCurrency(analytics.globalPlatformFees), icon: TrendingUp, color: "text-emerald-400", sub: "Ingreso por transacciones" },
        { label: "GMV Global Procesado", value: fmtCurrency(analytics.globalGmv), icon: DollarSign, color: "text-amber-400", sub: "Volumen total de ventas" },
        { label: "Ingreso Total Acumulado", value: fmtCurrency(saasMrr + analytics.globalPlatformFees), icon: Landmark, color: "text-white", sub: "SaaS + Comisiones" },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white font-heading">Facturación & Revenue</h1>
                    <p className="text-zinc-400 mt-1.5">Monitoreo de ingresos recurrentes (SaaS) y comisiones por transacción (8%).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(stat => (
                    <Card key={stat.label} className="bg-zinc-900 border-zinc-800 shadow-sm border-l-4" style={{ borderLeftColor: stat.color.includes('text-') ? undefined : stat.color }}>
                        <CardContent className="p-5 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                                <div className={`h-10 w-10 rounded-lg bg-zinc-800/50 flex items-center justify-center ${stat.color}`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{stat.label.split(' ')[0]}</span>
                            </div>
                            <div className="mt-2">
                                <p className="text-2xl font-black text-white">{stat.value}</p>
                                <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{stat.sub}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* SaaS Subscriptions */}
                <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-white text-base">Suscripciones Recurrentes</CardTitle>
                        <CardDescription>Tiendas activas en planes de pago</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-left bg-zinc-800/20">
                                        <th className="py-3 px-6">Tenant</th>
                                        <th className="py-3 px-4">Plan</th>
                                        <th className="py-3 px-4">Estado</th>
                                        <th className="py-3 px-6 text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/60 font-medium">
                                    {subscriptions.filter(s => s.status === "active" || s.planId !== "Basic").map((sub) => {
                                        const plan = PLANS[sub.planId];
                                        return (
                                            <tr key={sub.id} className="hover:bg-zinc-800/40 transition-colors">
                                                <td className="py-4 px-6 font-mono text-[10px] text-zinc-400 truncate max-w-[120px]">{sub.id}</td>
                                                <td className="py-4 px-4">
                                                    <Badge className="bg-violet-500/10 text-violet-400 border-none text-[10px] uppercase font-bold">
                                                        {plan?.name || sub.planId}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <Badge variant="outline" className={sub.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-none text-[10px]" : "bg-red-500/10 text-red-400 border-none text-[10px]"}>
                                                        {sub.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-4 px-6 text-right text-white font-mono">
                                                    {fmtCurrency(plan?.monthlyPrice || 0)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Transaction Fees */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white text-base">Últimas Comisiones (8%)</CardTitle>
                        <CardDescription>Fees recaudados de ventas de tenants</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="space-y-0.5">
                            {analytics.latestPayments?.slice(0, 10).map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors border-b border-zinc-800/50 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                            <TrendingUp className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-zinc-500 font-mono tracking-tighter">{p.storeId?.substring(0, 8)}...</p>
                                            <p className="text-xs text-zinc-300 font-medium">Venta {fmtCurrency(p.amount)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-emerald-400">+{fmtCurrency(p.platformFee)}</p>
                                        <p className="text-[10px] text-zinc-600 tracking-tighter">{fmtDate(p.createdAt)}</p>
                                    </div>
                                </div>
                            ))}
                            {(!analytics.latestPayments || analytics.latestPayments.length === 0) && (
                                <div className="py-20 text-center text-zinc-600 text-xs">Sin transacciones recientes.</div>
                            )}
                        </div>
                    </CardContent>
                    <div className="p-4 bg-zinc-800/20 border-t border-zinc-800">
                        <p className="text-[10px] text-zinc-500 text-center uppercase font-bold tracking-widest">Revenue Dinámico habilitado</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
