import { ShoppingBag, CreditCard, CheckCircle2, Clock } from "lucide-react";

export default async function AdminOrdersPage() {
    // In Production: const orders = await getOrdersDesc(STORE_ID, { limit: 50 });
    // Aggregation logic computes the exact app fee derived from the orchestrator dynamically.
    const orders = [
        { id: "ord_101", channel: "WEB", status: "PAID", total: 12500, fee: 1000, net: 11500, time: "Hace 5 min", branch: "Delivery", settlementStatus: "TRANSIT" },
        { id: "ord_102", channel: "POS", status: "PENDING", total: 8400, fee: 672, net: 7728, time: "Hace 14 min", branch: "Centro", settlementStatus: "PENDING" },
        { id: "ord_103", channel: "MERCADOLIBRE", status: "PAID", total: 22000, fee: 1760, net: 20240, time: "Hace 1 hora", branch: "Fábrica", settlementStatus: "SETTLED" },
    ];

    const fmt = (val: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0 }).format(val);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Órdenes y Liquidaciones</h1>
                    <p className="text-muted-foreground">Historial de transacciones y estado de liquidaciones financieras.</p>
                </div>
            </div>

            <div className="border border-border rounded-xl bg-card overflow-hidden">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b bg-muted/50">
                            <tr className="border-b">
                                <th className="h-10 px-4 text-left font-medium text-muted-foreground">ID Orden</th>
                                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Canal</th>
                                <th className="h-10 px-4 text-right font-medium text-muted-foreground">Total Bruto</th>
                                <th className="h-10 px-4 text-right font-medium text-muted-foreground">Comisión (8%)</th>
                                <th className="h-10 px-4 text-right font-medium text-muted-foreground">Neto a Recibir</th>
                                <th className="h-10 px-4 text-center font-medium text-muted-foreground">Estado Orden</th>
                                <th className="h-10 px-4 text-center font-medium text-muted-foreground">Liquidación</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {orders.map((o) => (
                                <tr key={o.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle">
                                        <div className="font-medium">{o.id}</div>
                                        <div className="text-xs text-muted-foreground">{o.time}</div>
                                    </td>
                                    <td className="p-4 align-middle font-semibold text-xs text-primary">{o.channel}</td>
                                    <td className="p-4 align-middle text-right font-mono">{fmt(o.total)}</td>
                                    <td className="p-4 align-middle text-right font-mono text-destructive">-{fmt(o.fee)}</td>
                                    <td className="p-4 align-middle text-right font-mono font-bold text-emerald-600">{fmt(o.net)}</td>
                                    
                                    <td className="p-4 align-middle text-center">
                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            o.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                        }`}>
                                            {o.status}
                                        </span>
                                    </td>
                                    
                                    <td className="p-4 align-middle text-center">
                                        {o.settlementStatus === 'SETTLED' && (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                                                <CheckCircle2 className="w-3 h-3" /> Disponible en cuenta
                                            </span>
                                        )}
                                        {o.settlementStatus === 'TRANSIT' && (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
                                                <Clock className="w-3 h-3" /> En tránsito
                                            </span>
                                        )}
                                        {o.settlementStatus === 'PENDING' && (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full border">
                                                Pendiente de Cobro
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
