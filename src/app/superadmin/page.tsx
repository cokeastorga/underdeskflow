import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Landmark, Store, BarChart, PlusCircle, Building, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(amount);
}

// Suspense-wrapped action component to satisfy the Next.js static renderer safely
function SuperAdminActions() {
    return (
        <div className="flex flex-wrap gap-4 mt-6 mb-8 bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex-1">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" />
                    Gestión de Tenants
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                    No tienes tiendas asociadas a esta cuenta o necesitas crear un nuevo tenant para un cliente.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <Link href="/tenant/onboarding">
                    <Button size="lg" className="w-full sm:w-auto shadow-md hover:scale-[1.02] transition-transform">
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Crear Nueva Tienda
                    </Button>
                </Link>
            </div>
        </div>
    );
}

import { getSuperAdminAnalytics, getSuperAdminTimeSeries } from "@/domains/analytics/services.server";
import { RevenueChart } from "@/components/superadmin/RevenueChart";
export default async function SuperAdminDashboard() {
    let analytics: any = null;
    let timeSeries: any[] = [];
    let error: string | null = null;

    try {
        const [a, ts] = await Promise.all([
            getSuperAdminAnalytics(),
            getSuperAdminTimeSeries()
        ]);
        analytics = a;
        timeSeries = ts;
    } catch (e: any) {
        console.error("[SuperAdmin] Dashboard data fetch failed:", e);
        error = e.message || "Error desconocido al cargar datos globales.";
    }

    // Fallback analytics if fetch fails
    const safeAnalytics = analytics || {
        globalGmv: 0,
        globalPlatformFees: 0,
        totalOrders: 0,
        activeStores: 0,
        latestPayments: [],
        storesMissingMp: []
    };

    if (error) {
        return (
            <div className="p-8 max-w-7xl mx-auto space-y-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error en el Dashboard</AlertTitle>
                    <AlertDescription>
                        {error}. Por favor, verifica la conexión con Firestore o las credenciales del sistema.
                    </AlertDescription>
                </Alert>
                <Button onClick={() => redirect("/superadmin")} variant="outline">
                    Reintentar
                </Button>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">UnderDeskFlow Centro de Mando</h1>
                <p className="text-zinc-400 mt-2 font-medium">
                    Visión global de los ingresos SaaS, GMV y estado de salud de todos los tenants.
                </p>
            </div>

            <Suspense fallback={<div className="h-24 bg-muted/20 animate-pulse rounded-xl my-6" />}>
                <SuperAdminActions />
            </Suspense>

            <div className="grid gap-6">
                 <RevenueChart data={timeSeries} />
            </div>

            {safeAnalytics.storesMissingMp && safeAnalytics.storesMissingMp.length > 0 && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Atención: Tenants Desvinculados</AlertTitle>
                    <AlertDescription>
                        Los siguientes tenants no han completado el flujo OAuth de Mercado Pago y no podrán procesar pagos en su E-commerce:
                        <ul className="list-disc ml-5 mt-2 text-xs">
                            {safeAnalytics.storesMissingMp.map((s: any) => (
                                <li key={s.id}>{s.name} <span className="text-muted-foreground opacity-70">({s.id})</span></li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Ingresos de Plataforma (Fees 8%) */}
                <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
                            Ingreso Bruto (8% UDF Fee)
                        </CardTitle>
                        <Landmark className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                            {formatCurrency(safeAnalytics.globalPlatformFees || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Ganancia neta recolectada de todas las tiendas
                        </p>
                    </CardContent>
                </Card>

                {/* GMV */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white">Gross Merchandising Value (GMV)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-white">{formatCurrency(safeAnalytics.globalGmv || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Volumen total transaccionado
                        </p>
                    </CardContent>
                </Card>

                {/* Active Stores */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white">Tiendas Activas</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-white">{safeAnalytics.activeStores || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Procesando pagos reales
                        </p>
                    </CardContent>
                </Card>

                {/* Total Orders */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-white">Total de Órdenes</CardTitle>
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-white">{safeAnalytics.totalOrders || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Generadas en todos los canales (POS, Bricks)
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 pt-4">
                <Card className="col-span-full bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">Últimos Pagos Globales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] font-bold uppercase tracking-wider text-left bg-zinc-800/20">
                                        <th className="py-3 px-4">Tenant ID</th>
                                        <th className="py-3 px-4">PSP</th>
                                        <th className="py-3 px-4 text-right">Monto Bruto</th>
                                        <th className="py-3 px-4 text-right">UDF Fee (8%)</th>
                                        <th className="py-3 px-4 pl-8">Estado</th>
                                        <th className="py-3 px-4 text-right">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {(safeAnalytics.latestPayments || []).map((p: any, i: number) => (
                                        <tr key={i} className="hover:bg-zinc-800/40 transition-colors">
                                            <td className="py-3 px-4 font-mono text-[10px] text-zinc-400">{p.storeId?.substring(0, 12)}...</td>
                                            <td className="py-3 px-4 capitalize text-[10px]">
                                                <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 border-none font-normal">{p.provider || "mercadopago"}</Badge>
                                            </td>
                                            <td className="py-3 px-4 font-bold text-white text-right">{formatCurrency(p.amount || 0)}</td>
                                            <td className="py-3 px-4 font-bold text-emerald-400 text-right">
                                                +{formatCurrency(p.platformFee || 0)}
                                            </td>
                                            <td className="py-3 px-4 pl-8">
                                                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-none px-2 py-0.5 uppercase font-bold tracking-tighter">
                                                    {p.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-[10px] text-zinc-500 font-mono text-right uppercase">
                                                {p.createdAt ? new Date(p.createdAt).toLocaleString("es-CL", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : "N/A"}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!safeAnalytics.latestPayments || safeAnalytics.latestPayments.length === 0) && (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center text-zinc-600 text-sm italic">
                                                No hay pagos recientes registrados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
