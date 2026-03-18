"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Shield, Globe, BarChart3, Code, Eye, Save, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { updateStoreFeatures } from "./actions";
import { toast } from "sonner";
import Link from "next/link";

interface FeatureClientProps {
    storeId: string;
    storeName: string;
    initialFeatures: any;
}

export default function FeatureClient({ storeId, storeName, initialFeatures }: FeatureClientProps) {
    const [features, setFeatures] = useState(initialFeatures);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateStoreFeatures(storeId, features);
            toast.success("Capacidades actualizadas para esta tienda");
        } catch (e) {
            toast.error("Error al guardar cambios");
        } finally {
            setSaving(false);
        }
    };

    const toggle = (key: string) => {
        setFeatures({ ...features, [key]: !features[key] });
    };

    const flagItems = [
        { key: "customDomain", label: "Dominios Personalizados", desc: "Permite conectar dominios externos (ej. mi-tienda.cl)", icon: Globe, color: "text-blue-400" },
        { key: "premiumThemes", label: "Temas Premium (V3)", desc: "Acceso exclusivo a layouts de alta conversión", icon: Zap, color: "text-amber-400" },
        { key: "advancedAnalytics", label: "Analítica Avanzada", desc: "Reportes detallados de retención y cohorts", icon: BarChart3, color: "text-emerald-400" },
        { key: "apiAccess", label: "Acceso a la API", desc: "Keys para integraciones con CRMs externos", icon: Code, color: "text-violet-400" },
        { key: "whiteLabel", label: "White Label", desc: "Remueve logos y marcas de UnderDeskFlow", icon: Eye, color: "text-zinc-200" },
        { key: "prioritySupport", label: "Soporte Prioritario", desc: "Tiempo de respuesta < 4h (SLA)", icon: Shield, color: "text-red-400" },
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/superadmin/stores">
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-500 hover:bg-zinc-800">
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold tracking-tight text-white font-heading">{storeName}</h1>
                        <Badge variant="outline" className="bg-zinc-800 text-zinc-500 border-zinc-700 text-[10px] uppercase font-bold px-2 py-0.5">Control de Capacidades</Badge>
                    </div>
                    <p className="text-zinc-400 text-xs mt-1 font-mono">{storeId}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                {flagItems.map((item) => (
                    <Card key={item.key} className="bg-zinc-900 border-zinc-800 group transition-all hover:border-zinc-700">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center ${item.color}`}>
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-base text-zinc-200">{item.label}</CardTitle>
                                    <CardDescription className="text-xs text-zinc-500 line-clamp-1">{item.desc}</CardDescription>
                                </div>
                            </div>
                            <Switch 
                                checked={features[item.key]} 
                                onCheckedChange={() => toggle(item.key)}
                                className="data-[state=checked]:bg-violet-600"
                            />
                        </CardHeader>
                    </Card>
                ))}
            </div>

            <div className="fixed bottom-0 right-0 left-0 bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800 p-6 flex justify-end gap-4">
                <Link href="/superadmin/stores">
                    <Button variant="outline" className="border-zinc-800 text-zinc-400 bg-zinc-950 px-8">Cancelar</Button>
                </Link>
                <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="bg-violet-600 hover:bg-violet-500 text-white shadow-xl shadow-violet-500/20 px-8"
                >
                    {saving ? "Guardando..." : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Aplicar Flags Enterprise
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
