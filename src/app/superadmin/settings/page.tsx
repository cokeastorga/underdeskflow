import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Shield, Zap, Bell, Save, CreditCard, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function HQSettingsPage() {
    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configuración del Ecosistema</h1>
                <p className="text-muted-foreground mt-2">
                    Administra los parámetros globales de la plataforma UnderDeskFlow.
                </p>
            </div>

            <div className="grid gap-8">
                {/* ── Moneda & Comisiones ──────────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-primary" />
                            Economía de la Plataforma
                        </CardTitle>
                        <CardDescription>Configura las tasas de comisión por transacción para todos los tenants.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="fee">Commission Fee Global (%)</Label>
                                <Input id="fee" defaultValue="8.00" type="number" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payout">Intervalo de Pago (Días)</Label>
                                <Input id="payout" defaultValue="7" type="number" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Seguridad & Accesos ──────────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Seguridad Global
                        </CardTitle>
                        <CardDescription>Controles de acceso y límites del sistema.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium">Modo Mantenimiento Internacional</p>
                                <p className="text-xs text-muted-foreground">Bloquea el acceso a todos los dashboards de tenants.</p>
                            </div>
                            <Switch />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium">Verificación de Email Obligatoria</p>
                                <p className="text-xs text-muted-foreground">Exige validación antes de permitir acceso al panel Tenant.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                {/* ── Notificaciones ──────────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            Comunicación del Sistema
                        </CardTitle>
                        <CardDescription>Alertas automáticas para el equipo de HQ.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm">Alertar sobre transacciones fallidas de alto valor</Label>
                            <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <Label className="text-sm">Reporte diario de nuevos registros (Daily Digest)</Label>
                            <Switch />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button size="lg" className="w-full sm:w-auto shadow-xl hover:scale-[1.02] transition-transform shadow-primary/20">
                        <Save className="mr-2 h-4 w-4" />
                        Guardar Cambios Globales
                    </Button>
                </div>
            </div>
        </div>
    );
}
