import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, CheckCircle2, AlertCircle, RefreshCcw, ExternalLink, ShieldAlert, Key, Store } from "lucide-react";
import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin-config";

async function getHQIntegrations() {
    try {
        const doc = await adminDb.doc("system/config/integrations/mercadopago").get();
        return doc.exists ? doc.data() : null;
    } catch (e) {
        console.error("Error fetching HQ integrations:", e);
        return null;
    }
}

async function getTenantIntegrations() {
    // Fetch stores where mpConnected is true
    const storesSnap = await adminDb.collection("stores").where("mpConnected", "==", true).get();
    const integrations = [];

    for (const storeDoc of storesSnap.docs) {
        const storeData = storeDoc.data();
        const mpDoc = await adminDb.doc(`stores/${storeDoc.id}/integrations/mercadopago`).get();
        
        if (mpDoc.exists) {
            const mpData = mpDoc.data();
            const expiresAt = mpData?.expiresAt || 0;
            const daysLeft = expiresAt ? Math.round((expiresAt - Date.now()) / (1000 * 60 * 60 * 24)) : null;
            
            integrations.push({
                storeId: storeDoc.id,
                storeName: storeData.name || "Sin nombre",
                userId: mpData?.userId,
                status: daysLeft !== null && daysLeft < 7 ? "expiring" : "active",
                daysLeft
            });
        }
    }
    
    return integrations.sort((a, b) => (a.daysLeft || 999) - (b.daysLeft || 999));
}

export default async function HQIntegrationsPage() {
    const [hqMp, tenantInteg] = await Promise.all([
        getHQIntegrations(),
        getTenantIntegrations()
    ]);
    
    const isHQConnected = !!hqMp?.accessToken;

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white font-heading">Vigía de Integraciones</h1>
                    <p className="text-zinc-400 mt-2">
                        Control global de tokens de Mercado Pago y conexiones maestras.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ── SECCIÓN HQ (Marketplace Account) ────────────────────── */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className={`border-2 bg-zinc-950 shadow-xl ${isHQConnected ? "border-emerald-500/20" : "border-amber-500/20"}`}>
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <ShieldAlert className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-lg text-zinc-100 uppercase tracking-tighter">Cuenta Maestra HQ</CardTitle>
                            </div>
                            <CardDescription className="text-xs text-zinc-500 leading-relaxed font-medium">
                                Esta cuenta recibe el **8% de comisión** de cada transacción. Es vital para el Split de Pagos.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isHQConnected ? (
                                <>
                                    <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">User ID Mercado Pago</p>
                                        <p className="font-mono text-sm text-zinc-300">{hqMp.userId || "DESCONOCIDO"}</p>
                                    </div>
                                    <Link href="/api/payments/mercadopago/connect?storeId=HQ_PLATFORM" className="block">
                                        <Button variant="outline" className="w-full h-10 border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300">
                                            <RefreshCcw className="mr-2 h-4 w-4" />
                                            Reconectar HQ
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <Link href="/api/payments/mercadopago/connect?storeId=HQ_PLATFORM" className="block">
                                    <Button className="w-full h-12 bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-600/20">
                                        <Zap className="mr-2 h-4 w-4 fill-current" />
                                        ¡Conectar Cuenta HQ!
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800 border-dashed">
                        <CardHeader className="py-4">
                            <CardTitle className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold">Estado del Marketplace</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-500">Scopes</span>
                                <Badge variant="outline" className="text-[9px] border-zinc-800 text-zinc-400 px-1 py-0">read, write, offline</Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-500">Redirect URI</span>
                                <div className="flex items-center gap-1 text-zinc-400">
                                    <span className="text-[9px] truncate max-w-[100px]">/callback</span>
                                    <ExternalLink className="h-3 w-3" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── MONITOR DE TENANTS (Vigía) ─────────────────────────── */}
                <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-zinc-200">Estado de Conexiones Tenants</CardTitle>
                            <CardDescription className="text-zinc-500">Monitor en tiempo real de los tokens de tiendas clientes.</CardDescription>
                        </div>
                        <Badge className="bg-zinc-800 text-zinc-400 border-none">{tenantInteg.length} Activas</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-left bg-zinc-800/10">
                                        <th className="py-4 px-6">Tienda / Tenant</th>
                                        <th className="py-4 px-4">User ID (MP)</th>
                                        <th className="py-4 px-4">Estado</th>
                                        <th className="py-4 px-6 text-right">Caducidad Token</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800/50">
                                    {tenantInteg.map((integ) => (
                                        <tr key={integ.storeId} className="hover:bg-zinc-800/30 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-violet-400 transition-colors">
                                                        <Store className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-zinc-300">{integ.storeName}</p>
                                                        <p className="text-[10px] font-mono text-zinc-600 line-clamp-1">{integ.storeId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-xs font-mono text-zinc-500 italic">
                                                {integ.userId || "---"}
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge variant="outline" className={`text-[10px] font-bold border-none ${
                                                    integ.status === "active" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500 animate-pulse"
                                                }`}>
                                                    {integ.status === "active" ? "OPERATIVAL" : "CRÍTICO"}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                {integ.daysLeft !== null ? (
                                                    <div className="flex flex-col items-end">
                                                        <span className={`text-xs font-bold ${integ.daysLeft < 7 ? "text-red-400" : "text-zinc-400"}`}>
                                                            {integ.daysLeft} días
                                                        </span>
                                                        <span className="text-[9px] text-zinc-600 italic">Renovación Auto</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-zinc-700 text-xs italic">Indefinido</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {tenantInteg.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-24 text-center text-zinc-600 text-sm">
                                                No hay tenants con Mercado Pago conectado actualmente.
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
