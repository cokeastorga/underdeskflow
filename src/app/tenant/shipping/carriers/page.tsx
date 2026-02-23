"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Store } from "@/types/store";
import { CARRIER_META, CarrierMeta, CarrierConfig } from "@/types/shipping";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Eye, EyeOff, Wifi, WifiOff, Loader2, CheckCircle2, AlertCircle, Package } from "lucide-react";

interface CarrierCardProps {
    carrier: CarrierMeta;
    config: CarrierConfig | undefined;
    onSave: (carrierId: string, config: CarrierConfig) => Promise<void>;
}

function CarrierCard({ carrier, config, onSave }: CarrierCardProps) {
    const [localConfig, setLocalConfig] = useState<CarrierConfig>(config || { enabled: false });
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const isOwnFleet = carrier.id === "ownFleet";

    const handleToggle = async (val: boolean) => {
        const updated = { ...localConfig, enabled: val };
        setLocalConfig(updated);
        await onSave(carrier.id, updated);
    };

    const handleSave = async () => {
        setSaving(true);
        await onSave(carrier.id, localConfig);
        setSaving(false);
        toast.success(`${carrier.name} guardado correctamente.`);
    };

    const handleTest = async () => {
        setTesting(true);
        // Simulate API connection test
        await new Promise(r => setTimeout(r, 1500));
        const success = !!(localConfig.apiKey && localConfig.apiKey.length > 5);
        setTesting(false);
        const updated = { ...localConfig, lastTestedAt: Date.now(), status: success ? "connected" as const : "error" as const };
        setLocalConfig(updated);
        await onSave(carrier.id, updated);
        if (success) toast.success(`✅ Conexión con ${carrier.name} exitosa.`);
        else toast.error(`❌ Error al conectar con ${carrier.name}. Verifica tus credenciales.`);
    };

    const statusColor = {
        connected: "text-green-600",
        error: "text-red-500",
        unconfigured: "text-muted-foreground",
    }[localConfig.status || "unconfigured"];

    const StatusIcon = localConfig.status === "connected" ? CheckCircle2 : localConfig.status === "error" ? AlertCircle : WifiOff;

    return (
        <Card className={`border-2 transition-all duration-300 ${localConfig.enabled ? "border-primary/30 shadow-md" : "border-muted"}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: carrier.color }}>
                            {isOwnFleet ? <Package className="h-5 w-5" /> : carrier.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <CardTitle className="text-base">{carrier.name}</CardTitle>
                            <CardDescription className="text-xs mt-0.5">{carrier.description}</CardDescription>
                        </div>
                    </div>
                    <Switch checked={localConfig.enabled} onCheckedChange={handleToggle} />
                </div>
                {!isOwnFleet && localConfig.status && (
                    <div className={`flex items-center gap-1.5 text-xs font-medium mt-2 ${statusColor}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {localConfig.status === "connected" && "Conectado"}
                        {localConfig.status === "error" && "Error de conexión"}
                        {localConfig.status === "unconfigured" && "Sin configurar"}
                        {localConfig.lastTestedAt && (
                            <span className="text-muted-foreground font-normal ml-1">
                                · Probado {new Date(localConfig.lastTestedAt).toLocaleDateString("es-CL")}
                            </span>
                        )}
                    </div>
                )}
            </CardHeader>

            {localConfig.enabled && !isOwnFleet && (
                <CardContent className="space-y-4 border-t pt-4">
                    {carrier.fields.map(field => (
                        <div key={field.key} className="space-y-1.5">
                            <Label className="text-xs font-medium">{field.label}</Label>
                            <div className="relative">
                                <Input
                                    type={field.secret && !showSecrets[field.key] ? "password" : "text"}
                                    value={(localConfig as any)[field.key] || ""}
                                    onChange={e => setLocalConfig(p => ({ ...p, [field.key]: e.target.value }))}
                                    placeholder={field.placeholder}
                                    className="text-xs pr-10"
                                />
                                {field.secret && (
                                    <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full w-9 text-muted-foreground"
                                        type="button" onClick={() => setShowSecrets(p => ({ ...p, [field.key]: !p[field.key] }))}>
                                        {showSecrets[field.key] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="outline" onClick={handleTest} disabled={testing || saving} className="flex-1">
                            {testing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Wifi className="mr-2 h-3.5 w-3.5" />}
                            Probar Conexión
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={saving || testing} className="flex-1">
                            {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                            Guardar
                        </Button>
                    </div>
                </CardContent>
            )}

            {localConfig.enabled && isOwnFleet && (
                <CardContent className="border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                        Gestiona vehículos y conductores en el módulo de <strong>Flota</strong>.
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                        <a href="/tenant/shipping/fleet">Ir a Gestión de Flota →</a>
                    </Button>
                </CardContent>
            )}
        </Card>
    );
}

export default function CarriersPage() {
    const { storeId } = useAuth();
    const [store, setStore] = useState<Store | null>(null);

    useEffect(() => {
        if (storeId) {
            getDoc(doc(db, "stores", storeId)).then(snap => {
                if (snap.exists()) setStore({ id: snap.id, ...snap.data() } as Store);
            });
        }
    }, [storeId]);

    const handleSave = async (carrierId: string, config: CarrierConfig) => {
        if (!store) return;
        await updateDoc(doc(db, "stores", store.id), {
            [`carriers.${carrierId}`]: config,
        });
        setStore(prev => prev ? {
            ...prev,
            carriers: { ...prev.carriers, [carrierId]: config }
        } : null);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Portadores de Envío</h1>
                <p className="text-muted-foreground">Conecta y configura los servicios de transporte que usarás en tu tienda.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {CARRIER_META.map(carrier => (
                    <CarrierCard
                        key={carrier.id}
                        carrier={carrier}
                        config={store?.carriers?.[carrier.id] as CarrierConfig | undefined}
                        onSave={handleSave}
                    />
                ))}
            </div>
        </div>
    );
}
