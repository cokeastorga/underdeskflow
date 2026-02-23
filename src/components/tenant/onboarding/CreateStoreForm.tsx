"use client";

import { useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Store } from "lucide-react";
import { toast } from "sonner";

export function CreateStoreForm() {
    const { user } = useAuth();
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim()) return;

        setLoading(true);
        try {
            // 1. Create store document
            const storeRef = await addDoc(collection(db, "stores"), {
                name: name.trim(),
                ownerId: user.uid,
                createdAt: Date.now(),
                currency: "CLP",
                onboardingStatus: 0,
                fulfillment: { pickup: true, delivery: false },
                design: {
                    template: "modern",
                    gridColumns: 4,
                    cardStyle: {
                        showSubtitle: true,
                        showPrice: true,
                        priceSize: "md",
                        shadow: "sm",
                        border: true,
                        hoverEffect: "lift",
                        buttonStyle: "solid"
                    }
                },
                compliance_status: "pending"
            });

            // 2. Update user profile with storeId
            await updateDoc(doc(db, "users", user.uid), {
                storeId: storeRef.id,
                storeCount: 1
            });

            toast.success("¡Tienda creada exitosamente!");
            // Refresh to trigger AuthContext update and show the wizard
            window.location.reload();
        } catch (error) {
            console.error("Error creating store:", error);
            toast.error("Error al crear la tienda. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-muted/30">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                        <Store className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Crea tu Primera Tienda</CardTitle>
                    <CardDescription>
                        Parece que aún no tienes una tienda configurada. Comencemos dándole un nombre.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="storeName">Nombre de la Tienda</Label>
                            <Input
                                id="storeName"
                                placeholder="Ej: Mi Boutique Online"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={loading}
                                className="h-12 text-lg"
                            />
                        </div>
                        <Button type="submit" className="w-full h-12 text-lg shadow-lg" disabled={loading || !name.trim()}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Creando Tienda...
                                </>
                            ) : (
                                "Crear y Continuar"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
