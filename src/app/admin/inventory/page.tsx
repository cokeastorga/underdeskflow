import { PackageSearch, ArrowLeftRight } from "lucide-react";
import Link from "next/link";

const STORE_ID = "store_1";

export default async function AdminInventoryPage() {
    // In Production: const balances = await getInventoryBalances(STORE_ID);
    const balances = [
        { id: "bal_1", productName: "Empanada de Pino", sku: "EMP-PINO", branchName: "Sucursal Centro", qty: 45 },
        { id: "bal_2", productName: "Coca Cola Zero 500ml", sku: "CCZ-500", branchName: "Sucursal Centro", qty: 12 },
        { id: "bal_3", productName: "Pie de Limón", sku: "PIE-LIM", branchName: "Fábrica Principal", qty: 100 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Ledger de Inventario</h1>
                    <p className="text-muted-foreground">Consulta saldos y audita los movimientos entre sucursales y la fábrica.</p>
                </div>
                
                <Link 
                    href="/admin/inventory/transfer" 
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                >
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Nueva Transferencia
                </Link>
            </div>

            <div className="border border-border rounded-xl bg-card overflow-hidden">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b bg-muted/50">
                            <tr className="border-b transition-colors hover:bg-muted/50">
                                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Producto / SKU</th>
                                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Ubicación</th>
                                <th className="h-10 px-4 text-right font-medium text-muted-foreground">Stock Actual</th>
                                <th className="h-10 px-4 text-right font-medium text-muted-foreground">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {balances.map((b) => (
                                <tr key={b.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle">
                                        <div className="font-medium">{b.productName}</div>
                                        <div className="text-xs text-muted-foreground">SKU: {b.sku}</div>
                                    </td>
                                    <td className="p-4 align-middle">{b.branchName}</td>
                                    <td className="p-4 align-middle text-right font-bold font-mono text-lg">{b.qty}</td>
                                    <td className="p-4 align-middle text-right">
                                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            b.qty > 20 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {b.qty > 20 ? "Saludable" : "Bajo Stock"}
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
