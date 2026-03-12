import { ShoppingBag } from "lucide-react";

const STORE_ID = "store_1";

export default async function AdminOrdersPage() {
    // In Production: const orders = await getOrdersDesc(STORE_ID, { limit: 50 });
    const orders = [
        { id: "ord_101", channel: "POS", status: "PAID", total: 12500, time: "Hace 5 min", branch: "Centro" },
        { id: "ord_102", channel: "STOREFRONT", status: "PENDING", total: 8400, time: "Hace 14 min", branch: "Delivery" },
        { id: "ord_103", channel: "MERCADOLIBRE", status: "PAID", total: 22000, time: "Hace 1 hora", branch: "Fábrica" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Órdenes Centralizadas</h1>
                    <p className="text-muted-foreground">Historial de transacciones de todos tus canales y terminales físicas.</p>
                </div>
            </div>

            <div className="border border-border rounded-xl bg-card overflow-hidden">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b bg-muted/50">
                            <tr className="border-b">
                                <th className="h-10 px-4 text-left font-medium text-muted-foreground">ID Orden</th>
                                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Canal</th>
                                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Sucursal</th>
                                <th className="h-10 px-4 text-right font-medium text-muted-foreground">Total</th>
                                <th className="h-10 px-4 text-right font-medium text-muted-foreground">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {orders.map((o) => (
                                <tr key={o.id} className="border-b transition-colors hover:bg-muted/50 cursor-pointer">
                                    <td className="p-4 align-middle">
                                        <div className="font-medium">{o.id}</div>
                                        <div className="text-xs text-muted-foreground">{o.time}</div>
                                    </td>
                                    <td className="p-4 align-middle font-semibold text-xs text-primary">{o.channel}</td>
                                    <td className="p-4 align-middle">{o.branch}</td>
                                    <td className="p-4 align-middle text-right font-mono">${o.total.toLocaleString("es-CL")}</td>
                                    <td className="p-4 align-middle text-right">
                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            o.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                        }`}>
                                            {o.status}
                                        </span>
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
