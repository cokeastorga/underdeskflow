import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, CreditCard } from "lucide-react";

interface FinancialStatsProps {
    grossSales: number;
    platformFees: number;
    netSales: number;
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(amount);
}

export function FinancialStats({ grossSales, platformFees, netSales }: FinancialStatsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3 mb-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ventas Brutas</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(grossSales)}</div>
                    <p className="text-xs text-muted-foreground">
                        Total cobrado a clientes
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Comisión Plataforma (8%)</CardTitle>
                    <CreditCard className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">
                        -{formatCurrency(platformFees)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Retenido automáticamente
                    </p>
                </CardContent>
            </Card>

            <Card className="border-primary/50 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-primary">Ingreso Neto a Recibir</CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-primary">{formatCurrency(netSales)}</div>
                    <p className="text-xs text-muted-foreground">
                        Depositado en tu cuenta conectada
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
