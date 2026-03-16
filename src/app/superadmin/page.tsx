import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Landmark, Store, BarChart } from "lucide-react";
import { getSuperAdminAnalytics } from "@/domains/analytics/services.server";

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(amount);
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
