import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Landmark, Store, BarChart, PlusCircle, Building } from "lucide-react";
import { getSuperAdminAnalytics } from "@/domains/analytics/services.server";
import { Button } from "@/components/ui/button";

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

export default async function SuperAdminDashboard() {
    const analytics = await getSuperAdminAnalytics();

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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 pt-4">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Auditoría de Liquidaciones: Platform Fees vs Paid Orders</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground border-t bg-muted/10 rounded-b-xl border-x border-b">
                        Gráfico de reconciliación de comisiones retenidas
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Tenants de Alto Rendimiento</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground border-t bg-muted/10 rounded-b-xl border-x border-b">
                        Top 5 Tiendas por GMV
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
