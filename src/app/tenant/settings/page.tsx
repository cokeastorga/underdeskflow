"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Store } from "@/types/store";
import { Loader2, Save } from "lucide-react";
import { StoreProfileForm } from "@/components/tenant/settings/StoreProfileForm";
import { StepOperations } from "@/components/tenant/onboarding/StepOperations";
import { FloatingGuide } from "@/components/tenant/guides/FloatingGuide";
import { useRouter, useSearchParams } from "next/navigation";

export default function SettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<Store | null>(null);






    // For onboarding redirection
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get("tab") || "general";

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) return;
            try {
                // Get user storeId first
                const userDoc = await getDoc(doc(db, "users", user.uid));
                const userData = userDoc.data();
                if (!userData?.storeId) return;

                const storeDoc = await getDoc(doc(db, "stores", userData.storeId));
                if (storeDoc.exists()) {
                    const data = { id: storeDoc.id, ...storeDoc.data() } as Store;
                    setConfig(data);


                }
            } catch (error) {
                console.error("Error fetching settings:", error);
                toast.error("Error al cargar la configuración.");
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [user]);

    const handleSave = async () => {
        if (!config || !user) return;
        setSaving(true);

        try {
            const updatedConfig: Partial<Store> = {
                // Name and currency handled by StoreProfileForm in General tab

            };

            await updateDoc(doc(db, "stores", config.id), updatedConfig);
            toast.success("Configuración guardada exitosamente.");
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar la configuración.");
        } finally {
            setSaving(false);
        }
    };



    if (loading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Configuración de la Tienda</h2>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Cambios
                </Button>
            </div>

            <Tabs defaultValue={activeTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="operations">Operación</TabsTrigger>
                </TabsList>

                {/* GENERAL TAB */}
                <TabsContent value="general">
                    <StoreProfileForm initialData={config as Store} />
                </TabsContent>

                {/* OPERATIONS TAB */}
                <TabsContent value="operations">
                    <Card>
                        <CardHeader>
                            <CardTitle>Operación y Logística</CardTitle>
                            <CardDescription>Configura cómo entregas tus productos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <StepOperations store={config as Store} onComplete={() => window.location.reload()} loading={loading} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
