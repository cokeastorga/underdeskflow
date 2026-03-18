import { adminDb } from "@/lib/firebase/admin-config";
import { PlusCircle, Store, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSubscription } from "@/domains/subscriptions/services.server";

import { StoreTable } from "@/components/superadmin/StoreTable";

async function getAllStores() {
    const snap = await adminDb.collection("stores").orderBy("createdAt", "desc").limit(200).get();
    const stores = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    
    // Enrich with actual subscription plans only if not denormalized
    const enriched = await Promise.all(stores.map(async (store) => {
        if (store.planId) return { ...store, plan: store.planId };
        
        try {
            const sub = await getSubscription(store.id);
            return { ...store, plan: sub.planId };
        } catch (e) {
            return { ...store, plan: "basic" };
        }
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
                    <h1 className="text-3xl font-bold tracking-tight text-white font-heading">Gestión de Tiendas</h1>
                    <p className="text-zinc-400 mt-1.5">
                        {stores.length} tenant{stores.length !== 1 ? "s" : ""} registrado{stores.length !== 1 ? "s" : ""} en el ecosistema
                    </p>
                </div>
                <Link href="/tenant/onboarding">
                    <Button className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 transition-all active:scale-95">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Nuevo Cliente
                    </Button>
                </Link>
            </div>

            <StoreTable stores={stores} />
        </div>
    );
}
