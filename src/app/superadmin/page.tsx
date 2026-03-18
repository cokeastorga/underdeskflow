import { Suspense } from "react";
import Link from "next/link";
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
    const [analytics, timeSeries] = await Promise.all([
        getSuperAdminAnalytics(),
        getSuperAdminTimeSeries()
    ]);

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">UnderDeskFlow Centro de Mando</h1>
                <p className="text-muted-foreground mt-2">
                    Visión global de los ingresos SaaS, GMV y estado de salud de todos los tenants.
                </p>
            </div>

            <Suspense fallback={<div className="h-24 bg-muted/20 animate-pulse rounded-xl my-6" />}>
                <SuperAdminActions />
            </Suspense>

            <div className="grid gap-6">
                 <RevenueChart data={timeSeries} />
            </div>

            {analytics.storesMissingMp && analytics.storesMissingMp.length > 0 && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Atención: Tenants Desvinculados</AlertTitle>
                    <AlertDescription>
                        Los siguientes tenants no han completado el flujo OAuth de Mercado Pago y no podrán procesar pagos en su E-commerce:
                        <ul className="list-disc ml-5 mt-2 text-xs">
                            {analytics.storesMissingMp.map((s: any) => (
                                <li key={s.id}>{s.name} <span className="text-muted-foreground opacity-70">({s.id})</span></li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Ingresos de Plataforma (Fees 8%) */}
                <Card className="border-emerald-500/50 bg-emerald-500/5 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
                            Ingreso Bruto (8% UDF Fee)
                        </CardTitle>
                        <Landmark className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                            {formatCurrency(analytics.globalPlatformFees)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Ganancia neta recolectada de todas las tiendas
                        </p>
                    </CardContent>
                </Card>

                {/* GMV */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gross Merchandising Value (GMV)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(analytics.globalGmv)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Volumen total transaccionado
                        </p>
                    </CardContent>
                </Card>

                {/* Active Stores */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tiendas Activas</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.activeStores}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Procesando pagos reales
                        </p>
                    </CardContent>
                </Card>

                {/* Total Orders */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Órdenes</CardTitle>
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalOrders}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Generadas en todos los canales (POS, Bricks)
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 pt-4">
                <Card className="col-span-full">
                    <CardHeader>
                        <CardTitle>Últimos Pagos Globales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-muted-foreground text-xs text-left">
                                        <th className="py-3 font-medium">Tenant ID</th>
                                        <th className="py-3 font-medium">PSP</th>
                                        <th className="py-3 font-medium text-right">Monto Bruto</th>
                                        <th className="py-3 font-medium text-right">UDF Fee (8%)</th>
                                        <th className="py-3 font-medium pl-4">Estado</th>
                                        <th className="py-3 font-medium text-right">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {analytics.latestPayments?.map((p: any, i: number) => (
                                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3 font-mono text-xs text-muted-foreground">{p.storeId?.substring(0, 10)}...</td>
                                            <td className="py-3 capitalize text-xs">
                                                <Badge variant="secondary" className="text-[10px] font-normal">{p.provider || "mercadopago"}</Badge>
                                            </td>
                                            <td className="py-3 font-semibold text-right">{formatCurrency(p.amount)}</td>
                                            <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-400 text-right">
                                                +{formatCurrency(p.platformFee)}
                                            </td>
                                            <td className="py-3 pl-4">
                                                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-none">
                                                    {p.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 text-xs text-muted-foreground text-right">
                                                {new Date(p.createdAt).toLocaleString("es-CL", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!analytics.latestPayments || analytics.latestPayments.length === 0) && (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-muted-foreground">
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
