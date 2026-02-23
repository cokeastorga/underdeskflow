/**
 * Conflict Inbox Page — /tenant/products/conflicts
 * 
 * Central hub for resolving data discrepancies.
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { ProductChangeEvent } from "@/types/channels";
import { ConflictDiffCard } from "@/components/tenant/products/ConflictDiffCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package, Inbox, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function ConflictInboxPage() {
    const { user, storeId } = useAuth();
    const [conflicts, setConflicts] = useState<ProductChangeEvent[]>([]);
    const [productNames, setProductNames] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    const fetchConflicts = async () => {
        if (!storeId || !user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/products/conflicts?storeId=${storeId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            setConflicts(data.conflicts);

            // Fetch product names for context
            const ids = Array.from(new Set(data.conflicts.map((c: any) => c.productId))) as string[];
            const names: Record<string, string> = {};

            for (const id of ids) {
                const d = await getDoc(doc(db, "products", id));
                if (d.exists()) {
                    names[id] = d.data().title || d.data().name;
                }
            }
            setProductNames(names);

        } catch (error: any) {
            console.error(error);
            toast.error("Error al cargar conflictos: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (storeId && user) {
            fetchConflicts();
        }
    }, [storeId, user]);

    const handleResolve = async (eventId: string, strategy: "PLATFORM_WINS" | "CHANNEL_WINS") => {
        if (!user || !storeId) return;

        try {
            const token = await user.getIdToken();
            const res = await fetch("/api/products/resolve-conflict", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ storeId, eventId, strategy })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Remove from list
            setConflicts(prev => prev.filter(c => c.id !== eventId));

        } catch (error: any) {
            console.error(error);
            throw error; // Re-throw to be caught by the card's toast handler
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bandeja de Conflictos</h1>
                    <p className="text-muted-foreground">
                        Sincronización manual requerida para {conflicts.length} eventos.
                    </p>
                </div>
            </div>

            {/* Empty State */}
            {conflicts.length === 0 ? (
                <Card className="border-dashed border-2 py-12">
                    <CardContent className="flex flex-col items-center justify-center text-center">
                        <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                        </div>
                        <h2 className="text-xl font-bold">¡Todo al día!</h2>
                        <p className="text-muted-foreground max-w-xs mt-2">
                            No hay discrepancias pendientes entre tu plataforma y los canales externos.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {conflicts.map(conflict => (
                        <ConflictDiffCard
                            key={conflict.id}
                            event={conflict}
                            productName={productNames[conflict.productId]}
                            onResolve={(strat) => handleResolve(conflict.id, strat)}
                        />
                    ))}
                </div>
            )}

            <div className="mt-8">
                <Card className="bg-muted/50 border-none">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Inbox className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-sm">¿Cómo funciona esto?</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="text-xs text-muted-foreground space-y-2">
                        <p>
                            <strong>Usar Plataforma:</strong> Ignora el cambio externo y vuelve a enviar el valor de tu catálogo maestro al canal (vía write-back).
                        </p>
                        <p>
                            <strong>Aceptar Externo:</strong> Actualiza tu catálogo maestro con el valor detectado en el canal externo.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
