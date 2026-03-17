import { adminDb } from "@/lib/firebase/admin-config";
import { PlusCircle, Store, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSubscription } from "@/domains/subscriptions/services.server";

async function getAllStores() {
    const snap = await adminDb.collection("stores").orderBy("createdAt", "desc").limit(100).get();
    const stores = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    
    // Enrich with actual subscription plans
    const enriched = await Promise.all(stores.map(async (store) => {
        const sub = await getSubscription(store.id);
        return { ...store, plan: sub.planId };
    }));
    
    return enriched;
}

export default async function SuperAdminStoresPage() {
    const stores = await getAllStores();

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Gestión de Tiendas</h1>
                    <p className="text-zinc-400 mt-1.5">
                        {stores.length} tenant{stores.length !== 1 ? "s" : ""} activo{stores.length !== 1 ? "s" : ""} en la plataforma
                    </p>
                </div>
                <Link href="/tenant/onboarding">
                    <Button className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 transition-all active:scale-95">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear Tienda para Cliente
                    </Button>
                </Link>
            </div>

            {/* Store Grid */}
            {stores.length === 0 ? (
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="py-20 text-center">
                        <Store className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-1">No hay tiendas registradas</h3>
                        <p className="text-zinc-500 text-sm mb-6">Crea la primera tienda cliente para comenzar.</p>
                        <Link href="/tenant/onboarding">
                            <Button className="bg-violet-600 hover:bg-violet-500">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Crear primera tienda
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {stores.map((store) => (
                        <Card key={store.id} className="group bg-zinc-900 border-zinc-800 hover:border-violet-500/40 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-200">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="h-10 w-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                                        <Store className="h-5 w-5 text-violet-400" />
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={store.isActive !== false
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]"
                                            : "bg-zinc-800 text-zinc-500 border-zinc-700 text-[10px]"}
                                    >
                                        {store.isActive !== false ? "Activa" : "Inactiva"}
                                    </Badge>
                                </div>
                                <CardTitle className="text-white text-base mt-2">{store.name || "Sin nombre"}</CardTitle>
                                <CardDescription className="text-zinc-500 text-xs font-mono">{store.id}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Plan badge */}
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-500">Plan</span>
                                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 border-zinc-700 capitalize">
                                        {store.plan || "basic"}
                                    </Badge>
                                </div>

                                {/* Domain */}
                                {store.customDomain && (
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-zinc-500">Dominio</span>
                                        <a
                                            href={`https://${store.customDomain}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-violet-400 hover:text-violet-300 flex items-center gap-1"
                                        >
                                            {store.customDomain}
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                )}

                                {/* MP Integration status */}
                                <div className="flex items-center gap-1.5 text-xs pt-2 border-t border-zinc-800">
                                    {store.mpConnected ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                    ) : (
                                        <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                                    )}
                                    <span className={store.mpConnected ? "text-emerald-400" : "text-amber-400"}>
                                        Mercado Pago {store.mpConnected ? "conectado" : "sin conectar"}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
