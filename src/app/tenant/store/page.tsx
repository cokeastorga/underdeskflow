"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Store, ExternalLink, Save, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { useAuth } from "@/lib/firebase/auth-context";

export default function StoreSettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [storeId, setStoreId] = useState<string | null>(null);
    const [config, setConfig] = useState<any>({
        name: "",
        currency: "USD",
        design: {
            heroCarousel: [],
            promoBanners: []
        }
    });

    useEffect(() => {
        const fetchStoreConfig = async () => {
            if (!user) return;
            try {
                // 1. Get User Data to find storeId
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    if (userData.storeId) {
                        setStoreId(userData.storeId);
                        // 2. Get Store Config
                        const storeDoc = await getDoc(doc(db, "stores", userData.storeId));
                        if (storeDoc.exists()) {
                            setConfig(storeDoc.data());
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching store config:", error);
                toast.error("Error al cargar la configuración.");
            } finally {
                setLoading(false);
            }
        };

        fetchStoreConfig();
    }, [user]);

    const handleSave = async () => {
        if (!storeId) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "stores", storeId), {
                name: config.name,
                currency: config.currency,
                // Update other fields as needed
            });
            toast.success("Configuración guardada correctamente.");
        } catch (error) {
            console.error("Error saving store config:", error);
            toast.error("Error al guardar.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex h-full items-center justify-center text-muted-foreground">Cargando tienda...</div>;
    }

    if (!storeId) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Store className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold">No tienes una tienda activa</h2>
                <p className="text-muted-foreground mt-2">Contacta a soporte para activar tu tienda.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mi Tienda</h1>
                    <p className="text-muted-foreground">Gestiona la apariencia y configuración de tu tienda online.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => window.open(`/${storeId}`, '_blank')}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Ver Tienda en Vivo
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar Cambios
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="design">Diseño</TabsTrigger>
                    <TabsTrigger value="advanced">Avanzado</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información Básica</CardTitle>
                            <CardDescription>Detalles principales de tu comercio.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="storeName">Nombre de la Tienda</Label>
                                <Input
                                    id="storeName"
                                    value={config.name || ""}
                                    onChange={(e) => setConfig({ ...config, name: e.target.value })}
                                    placeholder="Ej. Mi Tienda Digital"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">Moneda Principal</Label>
                                <Input
                                    id="currency"
                                    value={config.currency || ""}
                                    onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                                    placeholder="USD, MXN, CLP..."
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="design" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personalización Visual</CardTitle>
                            <CardDescription>Próximamente: Editor visual de banners y colores.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                            <ImageIcon className="h-10 w-10 text-muted-foreground mb-3" />
                            <h3 className="font-medium text-lg">Editor de Diseño en Construcción</h3>
                            <p className="text-muted-foreground text-sm max-w-sm mt-1">
                                Estamos trabajando en un editor visual drag-and-drop para tus banners y carruseles.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración Técnica</CardTitle>
                            <CardDescription>IDs de integración y claves API.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-4 bg-muted rounded-md text-sm font-mono break-all">
                                Store ID: {storeId}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
