"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Shield, Zap, Bell, Save, CreditCard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { updateSystemConfig } from "./actions";
import { toast } from "sonner";

interface SettingsClientProps {
    initialConfig: any;
}

export default function SettingsClient({ initialConfig }: SettingsClientProps) {
    const [config, setConfig] = useState(initialConfig);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSystemConfig(config);
            toast.success("Configuración global actualizada con éxito");
        } catch (e) {
            toast.error("Error al guardar los cambios");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white font-heading">Configuración del Ecosistema</h1>
                    <p className="text-zinc-400 mt-2">
                        Administra los parámetros globales de la plataforma UnderDeskFlow.
                    </p>
                </div>
            </div>

            {config.maintenanceMode && (
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-center gap-4 text-amber-500 shadow-lg shadow-amber-500/5">
                    <AlertTriangle className="h-6 w-6 shrink-0" />
                    <div className="text-sm">
                        <p className="font-bold uppercase tracking-tight">Modo Mantenimiento Activo</p>
                        <p className="opacity-80">La plataforma está restringida para todos los tenants y usuarios finales.</p>
                    </div>
                </div>
            )}

            <div className="grid gap-8 pb-12">
                {/* ── Moneda & Comisiones ──────────────────────────────────── */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-zinc-200">
                            <CreditCard className="h-5 w-5 text-violet-400" />
                            Economía de la Plataforma
                        </CardTitle>
                        <CardDescription className="text-zinc-500 font-medium">Configura las tasas de comisión por transacción para todos los tenants.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-zinc-400">Commission Fee Global (%)</Label>
                                <Input 
                                    className="bg-zinc-950 border-zinc-800 text-zinc-200"
                                    value={config.platformFee} 
                                    type="number" 
                                    onChange={(e) => setConfig({ ...config, platformFee: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-400">Intervalo de Pago (Días)</Label>
                                <Input 
                                    className="bg-zinc-950 border-zinc-800 text-zinc-200"
                                    value={config.payoutIntervalDays} 
                                    type="number" 
                                    onChange={(e) => setConfig({ ...config, payoutIntervalDays: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Seguridad & Accesos ──────────────────────────────────── */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-zinc-200">
                            <Shield className="h-5 w-5 text-violet-400" />
                            Seguridad Global
                        </CardTitle>
                        <CardDescription className="text-zinc-500 font-medium">Controles de acceso y límites del sistema.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/20 border border-zinc-800">
                            <div className="space-y-0.5">
                                <p className="text-sm font-semibold text-zinc-200 uppercase tracking-tight">Modo Mantenimiento</p>
                                <p className="text-xs text-zinc-500 italic">Bloquea el acceso a todos los dashboards de tenants y tiendas.</p>
                            </div>
                            <Switch 
                                checked={config.maintenanceMode} 
                                onCheckedChange={(val) => setConfig({ ...config, maintenanceMode: val })} 
                                className="data-[state=checked]:bg-violet-600"
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/20 border border-zinc-800">
                            <div className="space-y-0.5">
                                <p className="text-sm font-semibold text-zinc-200 uppercase tracking-tight">Nuevos Registros (SaaS)</p>
                                <p className="text-xs text-zinc-500 italic">Permite o bloquea el onboarding de nuevos negocios.</p>
                            </div>
                            <Switch 
                                checked={config.registrationEnabled} 
                                onCheckedChange={(val) => setConfig({ ...config, registrationEnabled: val })}
                                className="data-[state=checked]:bg-violet-600"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* ── Notificaciones ──────────────────────────────────── */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-zinc-200">
                            <Bell className="h-5 w-5 text-violet-400" />
                            Comunicación del Sistema
                        </CardTitle>
                        <CardDescription className="text-zinc-500 font-medium">Alertas automáticas para el equipo de HQ.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm text-zinc-300">Alertar sobre transacciones fallidas de alto valor</Label>
                            <Switch 
                                defaultChecked 
                                className="data-[state=checked]:bg-violet-600"
                            />
                        </div>
                        <Separator className="bg-zinc-800" />
                        <div className="flex items-center justify-between">
                            <Label className="text-sm text-zinc-300">Reporte diario de nuevos registros (Daily Digest)</Label>
                            <Switch className="data-[state=checked]:bg-violet-600" />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button 
                        size="lg" 
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-white shadow-xl shadow-violet-500/20 active:scale-95 transition-all px-8 border-none"
                    >
                        {saving ? (
                            "Guardando..."
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Guardar Configuración Enterprise
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
