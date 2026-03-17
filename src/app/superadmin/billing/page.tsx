import { getAllSubscriptions } from "@/domains/subscriptions/services.server";
import { PLANS } from "@/domains/subscriptions/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Landmark, Users, CreditCard, Calendar, ArrowUpRight } from "lucide-react";

function fmtDate(ms: number) {
    return new Intl.DateTimeFormat("es-CL", { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(ms));
}

export default async function SuperAdminBillingPage() {
    const subscriptions = await getAllSubscriptions();

    const activeCount = subscriptions.filter(s => s.status === "ACTIVE").length;
    const totalRevenue = subscriptions.reduce((acc, s) => {
        const plan = PLANS[s.planId];
        return s.status === "ACTIVE" ? acc + plan.monthlyPrice : acc;
    }, 0);

    const stats = [
        { label: "Suscripciones Activas", value: String(activeCount), icon: Users, color: "text-blue-400" },
        { label: "MRR Estimado (Mensual)", value: new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(totalRevenue), icon: Landmark, color: "text-emerald-400" },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Facturación & Planes</h1>
                <p className="text-zinc-400 mt-1.5">Monitoreo de ingresos recurrentes y suscripciones SaaS</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.map(stat => (
                    <Card key={stat.label} className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center ${stat.color}`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                                <p className="text-2xl font-black text-white">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white text-base">Estado de Suscripciones por Tenant</CardTitle>
                    <CardDescription className="text-zinc-500">Última actualización global de pagos</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-left">
                                    <th className="py-3 px-6">Tenant ID</th>
                                    <th className="py-3 px-4">Plan Actual</th>
                                    <th className="py-3 px-4">Estado</th>
                                    <th className="py-3 px-4">Próximo Cobro</th>
                                    <th className="py-3 px-6 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60">
                                {subscriptions.map((sub) => {
                                    const plan = PLANS[sub.planId];
                                    return (
                                        <tr key={sub.id} className="hover:bg-zinc-800/40 transition-colors">
                                            <td className="py-4 px-6 font-mono text-xs text-zinc-400">{sub.id}</td>
                                            <td className="py-4 px-4">
                                                <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20">
                                                    {plan.name}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge variant="outline" className={sub.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}>
                                                    {sub.status}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4 text-zinc-500 text-xs">
                                                {new Date(sub.currentPeriodEnd).toLocaleDateString("es-CL")}
                                            </td>
                                            <td className="py-4 px-6 text-right font-bold text-white">
                                                {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(plan.monthlyPrice)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
