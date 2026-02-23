"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { PLANS, getPlanById, formatPlanPrice } from "@/lib/billing/plans";
import { Plan, PlanId } from "@/types/billing";
import { PlanCard } from "@/components/tenant/billing/PlanCard";
import { Store } from "@/types/store";
import { toast } from "sonner";
import {
    CreditCard, Shield, Zap, Globe, Check, Percent,
    Store as StoreIcon, BarChart2, AlertCircle, Lock, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// ─── Fee Policy Card ─────────────────────────────────────────────────────────

function FeePolicyCard({ currentPlanId }: { currentPlanId: PlanId }) {
    const isEnterprise = currentPlanId === "enterprise";
    return (
        <Card className="border-indigo-500/30 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
            <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Percent className="h-4 w-4 text-indigo-500" />
                    Política de comisiones de plataforma
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {/* Own Store row */}
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <StoreIcon className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Tienda propia (todos los planes)</p>
                                <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 font-mono">8% fee</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Se aplica sobre el total de cada venta procesada en tu tienda propia — sin límite mínimo ni máximo.
                            </p>
                        </div>
                    </div>
                    {/* External Channel row */}
                    <div className={`flex items-start gap-3 p-3 rounded-lg ${isEnterprise ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-muted/30"}`}>
                        <Globe className={`h-5 w-5 mt-0.5 shrink-0 ${isEnterprise ? "text-emerald-500" : "text-muted-foreground"}`} />
                        <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium flex items-center gap-2">
                                    Canales externos (Enterprise)
                                    {!isEnterprise && <Lock className="h-3 w-3 text-muted-foreground" />}
                                </p>
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-mono">0% fee</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                La plataforma <strong>no cobra fee</strong> sobre ventas de canales externos (Shopify, Mercado Libre, PedidosYa, etc.).
                                Los canales propios cobran sus comisiones directamente.
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Enterprise Feature Table ─────────────────────────────────────────────────

function EnterpriseFeatureTable({ onUpgrade }: { onUpgrade: () => void }) {
    const features = [
        { icon: Globe, label: "Sincronización con canales externos", plans: [false, false, true] },
        { icon: BarChart2, label: "Analytics multicanal consolidado", plans: [false, false, true] },
        { icon: Percent, label: "0% fee en ventas de canales externos", plans: [false, false, true] },
        { icon: AlertCircle, label: "Resolución de conflictos de stock/precio", plans: [false, false, true] },
        { icon: StoreIcon, label: "Múltiples tiendas", plans: [false, true, true] },
        { icon: Zap, label: "API Access", plans: [false, true, true] },
    ];
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Comparativa de planes</h2>
                <div className="hidden md:grid grid-cols-3 gap-4 text-center text-xs font-semibold text-muted-foreground" style={{ width: "360px" }}>
                    <span>Básico</span>
                    <span>Intermedio</span>
                    <span className="text-violet-400">Enterprise ⭐</span>
                </div>
            </div>
            <Card>
                <div className="divide-y divide-border/50">
                    {features.map((f, i) => (
                        <div key={i} className="flex items-center gap-4 px-5 py-3">
                            <f.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <p className="flex-1 text-sm">{f.label}</p>
                            <div className="hidden md:grid grid-cols-3 gap-4 text-center" style={{ width: "360px" }}>
                                {f.plans.map((has, pi) => (
                                    <div key={pi} className="flex justify-center">
                                        {has ? (
                                            <Check className={`h-4 w-4 ${pi === 2 ? "text-violet-400" : "text-emerald-500"}`} />
                                        ) : (
                                            <span className="h-4 w-4 flex items-center justify-center text-muted-foreground/40 text-xs">—</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="px-5 py-4 bg-violet-500/5 border-t border-violet-500/20 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">¿Listo para conectar tus canales de venta?</p>
                    <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={onUpgrade}>
                        Activar Enterprise
                    </Button>
                </div>
            </Card>
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BillingPage() {
    const { storeId, user } = useAuth();
    const router = useRouter();
    const [store, setStore] = useState<Store | null>(null);
    const [storeCount, setStoreCount] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<Plan | null>(null);
    const [selectedProvider, setSelectedProvider] = useState<"webpay" | "mercadopago" | "flow">("webpay");

    useEffect(() => {
        if (!storeId || !user) return;
        getDoc(doc(db, "stores", storeId)).then(snap => {
            if (snap.exists()) setStore({ id: snap.id, ...snap.data() } as Store);
        });
        getDoc(doc(db, "users", user.uid)).then(snap => {
            if (snap.exists()) setStoreCount(snap.data().storeCount ?? 1);
        });
    }, [storeId, user]);

    const currentPlan: PlanId = store?.plan ?? "basic";
    const plan = getPlanById(currentPlan);

    const handleUpgrade = async (newPlan: Plan) => {
        setSelectedUpgradePlan(newPlan);
    };

    const handleProcessPayment = async () => {
        if (!selectedUpgradePlan || !storeId) return;

        setLoading(true);
        try {
            // 1. Create a "Subscription Order" record (system-level)
            const orderData = {
                orderNumber: `SUB-${Math.floor(100000 + Math.random() * 900000)}`,
                storeId,
                customerName: user?.displayName || user?.email || "Tenant",
                email: user?.email || "",
                type: "subscription_upgrade",
                planId: selectedUpgradePlan.id,
                totalAmount: selectedUpgradePlan.priceMonthly,
                currency: "CLP",
                status: 'pending',
                createdAt: Date.now(),
            };

            const orderRef = await addDoc(collection(db, "orders"), orderData);

            // 2. Initiate Payment Intent
            const response = await fetch("/api/payments/intents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order_id: orderRef.id,
                    payment_method: "card",
                    provider: selectedProvider
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al iniciar el pago");
            }

            const { client_url } = await response.json();

            if (client_url) {
                window.location.href = client_url;
            } else {
                throw new Error("No se recibió una URL de pago válida");
            }

        } catch (error: any) {
            console.error("Error in subscription payment:", error);
            toast.error(error.message || "Error al procesar el pago");
            setLoading(false);
        }
    };

    const handleEnterpriseUpgrade = () => {
        const enterprisePlan = PLANS.find(p => p.id === "enterprise");
        if (enterprisePlan) setSelectedUpgradePlan(enterprisePlan);
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto p-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Facturación y Plan</h1>
                <p className="text-muted-foreground text-sm mt-1">Administra tu suscripción, límites de uso y política de comisiones.</p>
            </div>

            {/* Current plan summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    {
                        label: "Plan actual", value: plan.name, icon: Zap,
                        color: currentPlan === "enterprise"
                            ? "text-violet-500 bg-violet-500/10"
                            : "text-indigo-500 bg-indigo-500/10"
                    },
                    { label: "Tiendas creadas", value: `${storeCount} / ${plan.maxStores}`, icon: CreditCard, color: "text-blue-500 bg-blue-500/10" },
                    { label: "Precio mensual", value: formatPlanPrice(plan.priceMonthly), icon: Shield, color: "text-emerald-500 bg-emerald-500/10" },
                ].map(stat => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.label}>
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-xl font-bold">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Fee Policy */}
            <FeePolicyCard currentPlanId={currentPlan} />

            {/* Enterprise Feature Comparison Table */}
            {currentPlan !== "enterprise" && (
                <EnterpriseFeatureTable onUpgrade={handleEnterpriseUpgrade} />
            )}

            {/* Enterprise active state */}
            {currentPlan === "enterprise" && (
                <Card className="border-violet-500/30 bg-gradient-to-br from-violet-500/5 to-transparent">
                    <CardContent className="p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                            <Globe className="h-6 w-6 text-violet-400" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold flex items-center gap-2">
                                Enterprise activo
                                <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">⭐ Enterprise</Badge>
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                                Tienes activados los canales externos, analytics multicanal y 0% fee en ventas externas.
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => router.push("/tenant/channels")}>
                            <Globe className="h-4 w-4 mr-2" />
                            Gestionar canales
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Plan upgrade cards */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Planes disponibles</h2>

                {selectedUpgradePlan && (
                    <Card className="mb-8 border-primary bg-primary/5">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                                <div className="flex-1 space-y-1">
                                    <h3 className="text-lg font-bold">Resumen de Actualización</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Estás por cambiar al plan <span className="font-bold text-foreground">{selectedUpgradePlan.name}</span>.
                                        El monto a pagar es <span className="font-bold text-foreground">{formatPlanPrice(selectedUpgradePlan.priceMonthly)}</span>.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 w-full md:w-auto min-w-[300px]">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Selecciona medio de pago</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => setSelectedProvider("webpay")}
                                            className={`p-2 rounded-lg border text-xs font-medium transition-all ${selectedProvider === "webpay" ? "bg-white border-primary shadow-sm" : "bg-muted/50 border-transparent"}`}
                                        >
                                            Webpay
                                        </button>
                                        <button
                                            onClick={() => setSelectedProvider("mercadopago")}
                                            className={`p-2 rounded-lg border text-xs font-medium transition-all ${selectedProvider === "mercadopago" ? "bg-white border-primary shadow-sm" : "bg-muted/50 border-transparent"}`}
                                        >
                                            MP
                                        </button>
                                        <button
                                            onClick={() => setSelectedProvider("flow")}
                                            className={`p-2 rounded-lg border text-xs font-medium transition-all ${selectedProvider === "flow" ? "bg-white border-primary shadow-sm" : "bg-muted/50 border-transparent"}`}
                                        >
                                            Flow
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="flex-1" onClick={() => setSelectedUpgradePlan(null)} disabled={loading}>
                                            Cancelar
                                        </Button>
                                        <Button className="flex-1" onClick={handleProcessPayment} disabled={loading}>
                                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pagar ahora"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLANS.map(p => (
                        <PlanCard
                            key={p.id}
                            plan={p}
                            currentPlan={currentPlan}
                            storeCount={storeCount}
                            onUpgrade={handleUpgrade}
                        />
                    ))}
                </div>
            </div>

            <p className="text-xs text-center text-muted-foreground pt-2">
                Los cambios de plan se aplican inmediatamente. Para facturación empresarial o pagos anuales,{" "}
                <a href="mailto:ventas@underdeskflow.com" className="underline">contáctanos</a>.
            </p>
        </div>
    );
}
