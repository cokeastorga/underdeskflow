import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, CheckCircle2, AlertCircle, RefreshCcw, ExternalLink } from "lucide-react";
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

export default async function HQIntegrationsPage() {
    const mpIntegration = await getHQIntegrations();
    const isConnected = !!mpIntegration?.accessToken;

    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Integraciones HQ</h1>
                <p className="text-muted-foreground mt-2">
                    Conecta las cuentas maestras de la plataforma para recibir comisiones y suscripciones.
                </p>
            </div>

            <div className="grid gap-8">
                <Card className={`border-2 ${isConnected ? "border-emerald-500/20 bg-emerald-500/5" : "border-amber-500/20 bg-amber-500/5 shadow-lg shadow-amber-500/10"}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-[#009EE3] text-white">
                                    <svg viewBox="0 0 32 32" className="h-6 w-6 fill-current">
                                        <path d="M23.5 12.5h-15c-.8 0-1.5.7-1.5 1.5v3c0 .8.7 1.5 1.5 1.5h15c.8 0 1.5-.7 1.5-1.5v-3c0-.8-.7-1.5-1.5-1.5zM11.5 17h-2v-2h2v2zm3 0h-2v-2h2v2zm3 0h-2v-2h2v2zm3 0h-2v-2h2v2z" />
                                        <path d="M16 2C8.3 2 2 8.3 2 16s6.3 14 14 14 14-6.3 14-14S23.7 2 16 2zm0 25c-6.1 0-11-4.9-11-11S9.9 5 16 5s11 4.9 11 11-4.9 11-11 11z" />
                                    </svg>
                                </div>
                                Mercado Pago Marketplace
                            </CardTitle>
                            <CardDescription className="text-base">
                                Esta cuenta recibirá el **8% de comisión** de cada transacción y los pagos de **suscripciones**.
                            </CardDescription>
                        </div>
                        <Badge className={`px-4 py-1 text-sm ${isConnected ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}`}>
                            {isConnected ? "Conectado" : "Acción Requerida"}
                        </Badge>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isConnected ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-background/50 border border-border space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">User ID</p>
                                        <p className="font-mono text-sm">{mpIntegration.userId || "N/A"}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-background/50 border border-border space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Última Sincronización</p>
                                        <p className="text-sm">{new Date(mpIntegration.updatedAt).toLocaleString("es-CL")}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Link href="/api/payments/mercadopago/connect?storeId=HQ_PLATFORM" className="flex-1">
                                        <Button variant="outline" className="w-full h-11 border-emerald-500/30 hover:bg-emerald-500/10">
                                            <RefreshCcw className="mr-2 h-4 w-4" />
                                            Reconectar Cuenta
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 flex gap-4">
                                    <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">Configuración Crítica Pendiente</p>
                                        <p className="text-xs text-amber-800/80 dark:text-amber-200/80 leading-relaxed">
                                            Debes conectar tu cuenta de Mercado Pago para procesar los cobros de la plataforma. Sin esto, los tenants no podrán realizar ventas que requieran split de comisión.
                                        </p>
                                    </div>
                                </div>
                                <Link href="/api/payments/mercadopago/connect?storeId=HQ_PLATFORM">
                                    <Button className="w-full h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all">
                                        <Zap className="mr-2 h-5 w-5 fill-current" />
                                        Conectar Cuenta Business HQ
                                    </Button>
                                </Link>
                                <p className="text-[10px] text-center text-muted-foreground italic">
                                    Serás redirigido a Mercado Pago para autorizar el acceso de UnderDeskFlow como tu Marketplace regional.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
                            <ExternalLink className="h-4 w-4" />
                            Otras Integraciones
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground italic">Próximamente: Stripe, SumUp, Resend...</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
