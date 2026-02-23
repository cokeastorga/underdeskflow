"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore";
import { CreditCard, DollarSign, Clock, CheckCircle2, XCircle, RefreshCw, TrendingUp, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PaymentIntent {
    id: string;
    amount: number;
    currency: string;
    status: string;
    provider: string;
    createdAt: any;
    customerEmail?: string;
    orderId?: string;
}

interface Payout {
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: any;
    bankAccount?: string;
}

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: any }> = {
    succeeded: { label: "Pagado", class: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
    processing: { label: "Procesando", class: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: RefreshCw },
    requires_payment_method: { label: "Fallido", class: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", icon: XCircle },
    canceled: { label: "Cancelado", class: "bg-muted text-muted-foreground border-border", icon: XCircle },
    PAID: { label: "Pagado", class: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
    PENDING: { label: "Pendiente", class: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: Clock },
    FAILED: { label: "Fallido", class: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", icon: XCircle },
};

const PROVIDER_COLORS: Record<string, string> = {
    stripe: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    webpay: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    mercadopago: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
};

function fmtAmount(amount: number, currency = "CLP") {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: currency.toUpperCase(), minimumFractionDigits: 0 }).format(amount);
}

function fmtDate(ts: any) {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function PaymentsPage() {
    const { storeId } = useAuth();
    const [intents, setIntents] = useState<PaymentIntent[]>([]);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalRevenue: 0,
        successCount: 0,
        pendingAmount: 0,
        payoutTotal: 0,
    });

    useEffect(() => {
        if (!storeId) return;

        async function load() {
            setLoading(true);
            try {
                // Payment intents
                const intentSnap = await getDocs(
                    query(collection(db, "payment_intents"),
                        where("store_id", "==", storeId),
                        orderBy("created_at", "desc"),
                        limit(50))
                );
                const intentData = intentSnap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentIntent));
                setIntents(intentData);

                // Payouts
                const payoutSnap = await getDocs(
                    query(collection(db, "payment_payouts"),
                        where("store_id", "==", storeId),
                        orderBy("created_at", "desc"),
                        limit(20))
                );
                const payoutData = payoutSnap.docs.map(d => ({ id: d.id, ...d.data() } as Payout));
                setPayouts(payoutData);

                // Summary
                const succeeded = intentData.filter(i => i.status === "succeeded" || i.status === "PAID");
                const pending = intentData.filter(i => i.status === "processing" || i.status === "PENDING");
                setSummary({
                    totalRevenue: succeeded.reduce((s, i) => s + (i.amount || 0), 0),
                    successCount: succeeded.length,
                    pendingAmount: pending.reduce((s, i) => s + (i.amount || 0), 0),
                    payoutTotal: payoutData.reduce((s, p) => s + (p.amount || 0), 0),
                });
            } catch (err) {
                console.error("Payments load error:", err);
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [storeId]);

    return (
        <div className="space-y-8 p-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-blue-500" />
                    </div>
                    Pagos y Cobros
                </h1>
                <p className="text-muted-foreground mt-1">Resumen de transacciones, balances y pagos a tu banco.</p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: DollarSign, label: "Revenue liquidado", value: loading ? "—" : fmtAmount(summary.totalRevenue), sub: `${summary.successCount} transacciones`, color: "text-emerald-500 bg-emerald-500/10" },
                    { icon: Clock, label: "En procesamiento", value: loading ? "—" : fmtAmount(summary.pendingAmount), sub: "pendiente de confirmar", color: "text-amber-500 bg-amber-500/10" },
                    { icon: Building2, label: "Total en payouts", value: loading ? "—" : fmtAmount(summary.payoutTotal), sub: `${payouts.length} liquidaciones`, color: "text-blue-500 bg-blue-500/10" },
                    { icon: TrendingUp, label: "PSPs activos", value: "3", sub: "Stripe · Webpay · MercadoPago", color: "text-violet-500 bg-violet-500/10" },
                ].map(card => (
                    <Card key={card.label}>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${card.color}`}>
                                    <card.icon className="h-4 w-4" />
                                </div>
                            </div>
                            <p className="text-xl font-bold">{card.value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* PSP Status */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Proveedores de Pago (PSPs)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { name: "Stripe", region: "Internacional", status: "active" },
                            { name: "Webpay", region: "Chile", status: "active" },
                            { name: "MercadoPago", region: "LATAM", status: "active" },
                            { name: "Flow", region: "Chile", status: "beta" },
                        ].map(psp => (
                            <div key={psp.name} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-card text-sm">
                                <div className={`h-2 w-2 rounded-full ${psp.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
                                <span className="font-semibold">{psp.name}</span>
                                <span className="text-muted-foreground text-xs">{psp.region}</span>
                                {psp.status === "beta" && <Badge variant="secondary" className="text-[10px] h-4">Beta</Badge>}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Transactions + Payouts Tabs */}
            <Tabs defaultValue="transactions">
                <TabsList>
                    <TabsTrigger value="transactions">Transacciones</TabsTrigger>
                    <TabsTrigger value="payouts">Liquidaciones</TabsTrigger>
                </TabsList>

                <TabsContent value="transactions" className="mt-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Últimas 50 transacciones</CardTitle>
                            <CardDescription>De todas las fuentes de pago</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="py-8 text-center text-muted-foreground text-sm">Cargando transacciones...</div>
                            ) : intents.length === 0 ? (
                                <div className="py-8 text-center">
                                    <CreditCard className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                                    <p className="text-muted-foreground text-sm">Aún no hay transacciones registradas.</p>
                                    <p className="text-muted-foreground text-xs mt-1">Las transacciones aparecerán aquí cuando tus clientes comiencen a pagar.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-xs text-muted-foreground">
                                                <th className="text-left py-2 pr-4 font-medium">ID</th>
                                                <th className="text-left py-2 pr-4 font-medium">Cliente</th>
                                                <th className="text-left py-2 pr-4 font-medium">PSP</th>
                                                <th className="text-right py-2 pr-4 font-medium">Monto</th>
                                                <th className="text-left py-2 pr-4 font-medium">Estado</th>
                                                <th className="text-left py-2 font-medium">Fecha</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {intents.map(intent => {
                                                const status = STATUS_CONFIG[intent.status] || STATUS_CONFIG["processing"];
                                                const StatusIcon = status.icon;
                                                return (
                                                    <tr key={intent.id} className="hover:bg-muted/30 transition-colors">
                                                        <td className="py-3 pr-4">
                                                            <span className="font-mono text-xs text-muted-foreground">{intent.id.slice(0, 16)}…</span>
                                                        </td>
                                                        <td className="py-3 pr-4 text-xs">{intent.customerEmail || "—"}</td>
                                                        <td className="py-3 pr-4">
                                                            <Badge variant="outline"
                                                                className={`text-[10px] ${PROVIDER_COLORS[intent.provider?.toLowerCase()] || ""}`}>
                                                                {intent.provider || "—"}
                                                            </Badge>
                                                        </td>
                                                        <td className="py-3 pr-4 text-right font-semibold">
                                                            {fmtAmount(intent.amount || 0, intent.currency)}
                                                        </td>
                                                        <td className="py-3 pr-4">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${status.class}`}>
                                                                <StatusIcon className="h-2.5 w-2.5" />
                                                                {status.label}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-xs text-muted-foreground">{fmtDate(intent.createdAt)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payouts" className="mt-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Historial de Liquidaciones</CardTitle>
                            <CardDescription>Transferencias a tu cuenta bancaria</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="py-8 text-center text-muted-foreground text-sm">Cargando...</div>
                            ) : payouts.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Building2 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                                    <p className="text-muted-foreground text-sm">Aún no hay liquidaciones registradas.</p>
                                    <p className="text-muted-foreground text-xs mt-1">Las liquidaciones aparecen aquí una vez que se procesen payouts hacia tu banco.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {payouts.map(payout => {
                                        const status = STATUS_CONFIG[payout.status] || STATUS_CONFIG["PENDING"];
                                        const StatusIcon = status.icon;
                                        return (
                                            <div key={payout.id} className="py-4 flex items-center justify-between">
                                                <div>
                                                    <p className="font-mono text-xs text-muted-foreground">{payout.id.slice(0, 20)}…</p>
                                                    <p className="text-sm font-semibold mt-0.5">{fmtAmount(payout.amount, payout.currency)}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(payout.createdAt)}</p>
                                                </div>
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${status.class}`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {status.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Security note */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/15 text-sm">
                <CreditCard className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="font-semibold text-blue-600 dark:text-blue-400">Pagos seguros PCI DSS Level 1</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                        Todos los datos de tarjetas son procesados directamente por los PSPs. Nunca almacenamos información de tarjetas en nuestros servidores.
                        Consulta nuestra <a href="/legal" className="underline hover:text-foreground">Política de Pagos</a> para más detalles.
                    </p>
                </div>
            </div>
        </div>
    );
}
