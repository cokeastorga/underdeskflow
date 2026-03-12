import { Tags } from "lucide-react";

export default async function AdminPricingPage() {
    // In Production: const rules = await getStorePriceRules(STORE_ID);
    const rules = [
        { id: "pr_1", variant: "Empanada de Pino", scope: "CHANNEL", scopeId: "RAPPI", type: "PERCENTAGE_MARKUP", value: "+15%" },
        { id: "pr_2", variant: "Coca Cola Zero 500ml", scope: "BRANCH", scopeId: "Sucursal Centro", type: "FIXED", value: "$1.500" },
        { id: "pr_3", variant: "Todas", scope: "GLOBAL", scopeId: "General", type: "PERCENTAGE_DISCOUNT", value: "-10%" },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Reglas de Precio Dinámicas</h1>
                    <p className="text-muted-foreground">Administra markups para delivery, o descuentos globales y por sucursal.</p>
                </div>
            </div>

            <div className="border border-border rounded-xl bg-card overflow-hidden">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b bg-muted/50">
                            <tr className="border-b transition-colors hover:bg-muted/50">
                                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Regla ID</th>
                                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Producto / Variante</th>
                                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Contexto (Scope)</th>
                                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Operación</th>
                                <th className="h-10 px-4 text-right font-medium text-muted-foreground">Valor</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {rules.map((r) => (
                                <tr key={r.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle text-muted-foreground font-mono text-xs">{r.id}</td>
                                    <td className="p-4 align-middle font-medium">{r.variant}</td>
                                    <td className="p-4 align-middle">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-xs font-bold text-primary">{r.scope}</span>
                                            <span className="text-xs text-muted-foreground">{r.scopeId}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                        <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold">
                                            {r.type.replace("_", " ")}
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle text-right font-bold text-lg">
                                        <span className={r.value.startsWith("+") ? "text-emerald-500" : r.value.startsWith("-") ? "text-red-500" : ""}>
                                            {r.value}
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
