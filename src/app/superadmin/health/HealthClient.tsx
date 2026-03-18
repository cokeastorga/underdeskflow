"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2, AlertCircle, Server, Database, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { checkSystemHealth, ServiceHealth } from "./actions";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

export default function HQHealthClient() {
    const [services, setServices] = useState<ServiceHealth[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshHealth = async () => {
        setLoading(true);
        try {
            const data = await checkSystemHealth();
            setServices(data);
        } catch (e) {
            console.error("Health check failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshHealth();
    }, []);

    const getIcon = (name: string) => {
        if (name.includes("Firestore")) return Database;
        if (name.includes("Mercado Pago")) return Globe;
        if (name.includes("Auth")) return Server;
        return Activity;
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Salud del Ecosistema</h1>
                    <p className="text-zinc-400 mt-2">
                        Monitoreo en tiempo real de los servicios críticos de UnderDeskFlow.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={refreshHealth}
                        disabled={loading}
                        className="border-zinc-800 bg-zinc-900 text-zinc-300"
                    >
                        <RefreshCcw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
                        {loading ? "Verificando..." : "Refrescar"}
                    </Button>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-4 py-1">
                        <CheckCircle2 className="w-3 h-3 mr-2" />
                        Sistemas Online
                    </Badge>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {loading && services.length === 0 ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="animate-pulse bg-zinc-900 border-zinc-800 h-40" />
                    ))
                ) : (
                    services.map((service) => {
                        const Icon = getIcon(service.name);
                        return (
                            <Card key={service.name} className="overflow-hidden bg-zinc-900 border-zinc-800 transition-all hover:shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-zinc-800/30">
                                    <CardTitle className="text-sm font-medium text-zinc-300">{service.name}</CardTitle>
                                    <Icon className="h-4 w-4 text-zinc-500" />
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <Badge variant="outline" className={
                                            service.status === "operational" 
                                            ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/20" 
                                            : "bg-red-500/5 text-red-500 border-red-500/20"
                                        }>
                                            {service.status}
                                        </Badge>
                                        <span className="text-xs font-mono text-zinc-500">{service.latency > 0 ? `${service.latency}ms` : "---"}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-zinc-500">Uptime 30d</span>
                                            <span className="font-medium text-zinc-300">{service.uptime}</span>
                                        </div>
                                        <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                                            <div className="bg-emerald-500 h-full w-[99.9%]" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-zinc-200">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                        Registro de Incidentes Recientes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-zinc-800/20 border border-zinc-800">
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-none shrink-0">Info</Badge>
                            <div>
                                <p className="text-sm font-medium text-zinc-200">Mantenimiento Programado Firebase Search</p>
                                <p className="text-xs text-zinc-500 mt-1">El despliegue de nuevos índices se ha completado exitosamente en todas las regiones.</p>
                                <span className="text-[10px] text-zinc-600 mt-2 block">Hace 2 horas</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-zinc-800/20 border border-zinc-800 opacity-60">
                            <Badge variant="outline" className="bg-zinc-500/10 text-zinc-500 border-none shrink-0 text-xs">Resolved</Badge>
                            <div>
                                <p className="text-sm font-medium text-zinc-400">Latencia Elevada en API de Transbank</p>
                                <p className="text-xs text-zinc-600 mt-1">Se detectó una degradación temporal en el servicio de autorización. Resuelto por el proveedor.</p>
                                <span className="text-[10px] text-zinc-700 mt-2 block">Ayer, 14:20</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
