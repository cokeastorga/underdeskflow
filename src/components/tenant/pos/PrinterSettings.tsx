"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Printer, Wifi, WifiOff, Loader2, TestTube, CheckCircle2, AlertCircle, Server } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

interface PrinterConfig {
    enabled: boolean;
    printerIp: string;
    printerPort: number;
    updatedAt?: string;
}

export function PrinterSettings() {
    const { storeId, user } = useAuth();
    const [config, setConfig] = useState<PrinterConfig>({
        enabled: false,
        printerIp: "",
        printerPort: 9100,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

    // ── Load config from Firestore ────────────────────────────────────────────
    useEffect(() => {
        if (!storeId) return;
        const load = async () => {
            const snap = await getDoc(doc(db, "stores", storeId, "settings", "kitchen_printer"));
            if (snap.exists()) setConfig(snap.data() as PrinterConfig);
            setLoading(false);
        };
        load();
    }, [storeId]);

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!storeId) return;
        setSaving(true);
        try {
            const updated: PrinterConfig = { ...config, enabled: !!config.printerIp, updatedAt: new Date().toISOString() };
            await setDoc(doc(db, "stores", storeId, "settings", "kitchen_printer"), updated);
            setConfig(updated);
            toast.success("Configuración guardada");
        } catch {
            toast.error("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    // ── Test print ────────────────────────────────────────────────────────────
    const handleTest = async () => {
        if (!config.printerIp) { toast.error("Ingresa la IP de la impresora"); return; }
        setTesting(true);
        setTestResult(null);
        try {
            const token = await user?.getIdToken();
            const res = await fetch("/api/pos/kitchen/print", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    printerIp: config.printerIp,
                    printerPort: config.printerPort,
                    ticketText: "=== TEST IMPRESORA ===\n\nUnderDesk Flow POS\nConexion TCP exitosa!\n\n21:00 - Javi",
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setTestResult("success");
            toast.success("¡Impresora respondió correctamente!");
        } catch (err: any) {
            setTestResult("error");
            toast.error(err.message ?? "Error de conexión con impresora");
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Status banner */}
            {config.enabled ? (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium text-emerald-600">Impresora de cocina activa — {config.printerIp}:{config.printerPort}</span>
                </div>
            ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <span className="text-sm text-amber-600">
                        Sin impresora de red configurada — usando <strong>window.print()</strong> como fallback
                    </span>
                </div>
            )}

            {/* Config form */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Printer className="h-4 w-4" /> Impresora térmica de red
                    </CardTitle>
                    <CardDescription>
                        Compatible con Epson TM-T20/T88, Star TSP100, BIXOLON. Protocolo TCP/ESC-POS, puerto 9100.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-1.5">
                            <Label>IP de la impresora</Label>
                            <Input
                                value={config.printerIp}
                                onChange={(e) => setConfig({ ...config, printerIp: e.target.value })}
                                placeholder="192.168.1.100"
                                className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                Recomendamos reservar la IP en el router (DHCP estático).
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Puerto TCP</Label>
                            <Input
                                type="number"
                                value={config.printerPort}
                                onChange={(e) => setConfig({ ...config, printerPort: Number(e.target.value) })}
                                className="font-mono"
                            />
                        </div>
                    </div>

                    {/* Test result */}
                    {testResult && (
                        <div className={`flex items-center gap-2 p-2.5 rounded-lg text-sm ${
                            testResult === "success"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-red-500/10 text-red-600"
                        }`}>
                            {testResult === "success"
                                ? <CheckCircle2 className="h-4 w-4" />
                                : <AlertCircle className="h-4 w-4" />}
                            {testResult === "success"
                                ? "Conexión exitosa — ticket de prueba enviado"
                                : "No se pudo conectar — verifica IP y que la impresora esté encendida"}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            variant="outline" size="sm"
                            onClick={handleTest}
                            disabled={testing || !config.printerIp}
                            className="gap-2"
                        >
                            {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TestTube className="h-3.5 w-3.5" />}
                            Probar conexión
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            Guardar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Info box */}
            <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="p-4 flex gap-3">
                    <Server className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-600">¿Cómo funciona?</p>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                            <li>El servidor envía bytes ESC/POS via TCP al puerto 9100</li>
                            <li>La impresora no necesita drivers — es protocolo nativo</li>
                            <li>El corte de papel se realiza automáticamente</li>
                            <li>Si no hay impresora configurada, se usa window.print() como fallback</li>
                            <li>Funciona desde cualquier dispositivo en la misma red</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
