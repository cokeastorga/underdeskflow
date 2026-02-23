"use client";

import { useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase/config"; // Client SDK
import { doc, getDoc } from "firebase/firestore";

interface SumUpMigrationProps {
    storeId: string;
}

export function SumUpMigration({ storeId }: SumUpMigrationProps) {
    const [apiKey, setApiKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<{ imported: number; duplicates: number; errors: number; total: number } | null>(null);

    const handleMigrate = async () => {
        if (!apiKey) {
            toast.error("Por favor ingresa tu API Key de SumUp");
            return;
        }

        setLoading(true);
        setStats(null);

        try {
            // Get ID Token for Auth
            // implementation detail: auth.currentUser?.getIdToken()
            // We can import auth from config directly if useAuth hook is not available or doesn't expose getToken
            const token = await (await import("@/lib/firebase/config")).auth.currentUser?.getIdToken();

            if (!token) {
                toast.error("Error de autenticación. Por favor recarga la página.");
                setLoading(false);
                return;
            }

            const response = await fetch("/api/integrations/sumup/migrate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    apiKey,
                    storeId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error en la migración");
            }

            setStats({
                imported: data.imported,
                duplicates: data.duplicates,
                errors: data.errors,
                total: data.totalFound
            });

            toast.success(`Migración completada: ${data.imported} transacciones importadas.`);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Ocurrió un error inesperado");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-blue-100 dark:border-blue-900 overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <svg
                    width="120"
                    height="120"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-blue-500"
                >
                    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                    <path d="M12 12v9" />
                    <path d="m16 16-4-4-4 4" />
                </svg>
            </div>

            <CardHeader className="bg-blue-50/50 dark:bg-blue-950/20">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <ArrowRight className="h-4 w-4" />
                    </div>
                    Migración desde SumUp
                </CardTitle>
                <CardDescription>
                    Importa tu historial de ventas desde tus terminales SumUp directamente a tu panel.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                {!stats ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">SumUp API Key</Label>
                            <Input
                                id="apiKey"
                                type="password"
                                placeholder="su_..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Puedes generar una API Key en el <a href="https://me.sumup.com/developers" target="_blank" rel="noreferrer" className="underline hover:text-primary">Portal de Desarrolladores de SumUp</a>.
                            </p>
                        </div>

                        <Button
                            onClick={handleMigrate}
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Migrando...
                                </>
                            ) : (
                                "Comenzar Migración"
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <AlertTitle className="text-green-800 dark:text-green-300">Migración Exitosa</AlertTitle>
                            <AlertDescription className="text-green-700 dark:text-green-400">
                                Proceso finalizado correctamente.
                            </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-3 gap-2 text-center text-sm">
                            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                                <span className="block text-2xl font-bold">{stats.imported}</span>
                                <span className="text-muted-foreground">Importados</span>
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                                <span className="block text-2xl font-bold">{stats.duplicates}</span>
                                <span className="text-muted-foreground">Duplicados</span>
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                                <span className="block text-2xl font-bold">{stats.errors}</span>
                                <span className="text-muted-foreground">Errores</span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setStats(null)}
                        >
                            Realizar otra migración
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
