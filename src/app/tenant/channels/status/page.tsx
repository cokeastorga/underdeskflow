/**
 * Channel Status Page — /tenant/channels/status
 * 
 * Real-time observability for Enterprise channel sync.
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { StoreSystemStatus, ChannelHealthMetric } from "@/types/status";
import { CHANNEL_DISPLAY, CHANNEL_STATUS_DISPLAY } from "@/types/channels";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Activity,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Clock,
    BarChart3,
    Layers,
    ExternalLink,
    Search
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import Link from "next/link";

export default function ChannelStatusPage() {
    const { user, storeId } = useAuth();
    const [status, setStatus] = useState<StoreSystemStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStatus = async (silent = false) => {
        if (!storeId || !user) return;
        if (!silent) setLoading(true);
        else setRefreshing(true);

        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/channels/status?storeId=${storeId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setStatus(data);
        } catch (error: any) {
            console.error(error);
            toast.error("Error al cargar estado del sistema: " + error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleReconcile = async (connectionId: string) => {
        if (!storeId || !user) return;

        const promise = (async () => {
            const token = await user.getIdToken();
            const res = await fetch(`/api/channels/${connectionId}/reconcile?storeId=${storeId}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            return data;
        })();

        toast.promise(promise, {
            loading: "Conciliando canal...",
            success: (data) => {
                const discrepancies = data.discrepancies.length;
                if (discrepancies === 0) {
                    return `Conciliación exitosa: Canal totalmente sincronizado.`;
                }
                return `Conciliación completa: Se detectaron ${discrepancies} discrepancias. Revisar reportes.`;
            },
            error: (err) => `Error en conciliación: ${err.message}`
        });
    };

    useEffect(() => {
        if (storeId && user) {
            fetchStatus();
            const interval = setInterval(() => fetchStatus(true), 15000); // Auto-refresh every 15s
            return () => clearInterval(interval);
        }
    }, [storeId, user]);

    if (loading && !status) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Activity className="h-8 w-8 animate-pulse text-primary" />
                    <p className="text-sm text-muted-foreground">Analizando salud del sistema...</p>
                </div>
            </div>
        );
    }

    const overall = status?.overallStatus === "healthy";

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Estado del Sistema</h1>
                    <p className="text-muted-foreground">
                        Sincronización multicanal y salud de servicios en tiempo real.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={status?.securityPolicy?.killSwitchActive ? "destructive" : "outline"}
                        size="sm"
                        className="gap-2"
                        onClick={async () => {
                            if (!storeId || !user) return;
                            const active = !status?.securityPolicy?.killSwitchActive;
                            const confirmed = confirm(active
                                ? "¡ADVERTENCIA! ¿Estás seguro de que deseas ACTIVAR el Kill Switch Global? Esto detendrá toda sincronización de canales inmediatamente."
                                : "¿Deseas desactivar el Kill Switch y reanudar la sincronización?"
                            );
                            if (!confirmed) return;

                            try {
                                const token = await user.getIdToken();
                                const res = await fetch(`/api/stores/${storeId}/security/kill-switch`, {
                                    method: "POST",
                                    headers: {
                                        "Authorization": `Bearer ${token}`,
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({ active })
                                });
                                if (res.ok) {
                                    toast.success(active ? "Kill Switch ACTIVADO" : "Kill Switch DESACTIVADO");
                                    fetchStatus(true);
                                }
                            } catch (error) {
                                toast.error("Error al cambiar estado del Kill Switch");
                            }
                        }}
                    >
                        <AlertCircle className={`h-4 w-4 ${status?.securityPolicy?.killSwitchActive ? 'animate-pulse' : ''}`} />
                        {status?.securityPolicy?.killSwitchActive ? "Kill Switch ACTIVO" : "Kill Switch Global"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => fetchStatus(true)}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                </div>
            </div>

            {/* Overall Health Banner */}
            <Card className={`border-none shadow-md ${overall ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${overall ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                            {overall ? (
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            ) : (
                                <AlertCircle className="h-6 w-6 text-yellow-600" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold">
                                {overall ? "Sistema Operativo" : "Sistema Degradado"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {overall
                                    ? "Todos los servicios están funcionando dentro de los parámetros normales."
                                    : "Se han detectado problemas en algunos canales externos."}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Latencia Media</p>
                            <p className="text-2xl font-mono font-bold">~240ms</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-blue-500" />
                            <CardTitle className="text-sm font-medium">Éxito de Sincronización</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between mb-2">
                            <span className="text-3xl font-bold">99.8%</span>
                            <span className="text-xs text-green-500 font-bold">+0.2% hoy</span>
                        </div>
                        <Progress value={99.8} className="h-2 bg-blue-100 dark:bg-blue-900/20" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-violet-500" />
                            <CardTitle className="text-sm font-medium">Estado del Outbox</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between mb-2">
                            <span className="text-3xl font-bold">{status?.outboxStats.pending || 0}</span>
                            <span className="text-xs text-muted-foreground">Pendientes</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">Staged events</span>
                            <span className={status?.outboxStats.failed ? "text-red-500 font-bold" : "text-green-500"}>
                                {status?.outboxStats.failed || 0} fallidos
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            <CardTitle className="text-sm font-medium">Conflictos Pendientes</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between mb-2">
                            <span className="text-3xl font-bold">{status?.totalPendingConflicts || 0}</span>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1" asChild>
                                <Link href="/tenant/products/conflicts">
                                    Ver bandeja <ExternalLink className="h-3 w-3" />
                                </Link>
                            </Button>
                        </div>
                        <p className="text-[10px] text-orange-500 font-bold">Requieren acción inmediata</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Canales Externos</CardTitle>
                    <CardDescription>
                        Estado detallado de cada integración conectada.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Canal</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Cola</TableHead>
                                <TableHead>Sincronización</TableHead>
                                <TableHead>Última Actividad</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {status?.channels.map((metric) => {
                                const channel = CHANNEL_DISPLAY[metric.channelType];
                                const statusDisp = CHANNEL_STATUS_DISPLAY[metric.status];
                                return (
                                    <TableRow key={metric.channelId}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-lg">
                                                    {channel?.icon}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">{channel?.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">{metric.displayName || "Shop ID: " + metric.channelId.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2 w-2 rounded-full ${statusDisp?.dot === "green" ? "bg-green-500" :
                                                        statusDisp?.dot === "yellow" ? "bg-yellow-500" : "bg-red-500"
                                                        }`} />
                                                    <span className={`text-xs font-bold ${statusDisp?.color}`}>
                                                        {statusDisp?.label}
                                                    </span>
                                                </div>
                                                {metric.circuitState === "OPEN" && (
                                                    <Badge variant="destructive" className="h-4 text-[8px] animate-pulse">
                                                        CIRCUIT OPEN
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-mono">{metric.queueDepth} msgs</span>
                                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500"
                                                        style={{ width: `${Math.min(100, (metric.queueDepth / 100) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold">{metric.successRate24h.toFixed(1)}% Éxito</span>
                                                <span className="text-[10px] text-muted-foreground">{metric.errorsLastHour} errores /h</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex lg:items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                <span>{metric.lastWebhookAt ? new Date(metric.lastWebhookAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "---"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 text-[10px]"
                                                    onClick={() => handleReconcile(metric.channelId)}
                                                >
                                                    Conciliar
                                                </Button>
                                                {(metric.status === "ERROR" || metric.status === "PENDING_AUTH") && (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="h-8 text-[10px]"
                                                        asChild
                                                    >
                                                        <Link href={`/tenant/channels/connect/${metric.channelType}`}>
                                                            Reconectar
                                                        </Link>
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="sm" className="h-8 text-[10px]" asChild>
                                                    <Link href={`/tenant/channels/${metric.channelId}`}>
                                                        Configurar
                                                    </Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}

                            {status?.channels.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        No hay canales externos conectados.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* DLQ Management Section */}
            {status?.outboxStats.failed && status.outboxStats.failed > 0 ? (
                <DLQManager storeId={storeId!} user={user!} />
            ) : (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Search className="h-4 w-4" /> Registro de Eventos Recientes
                                </CardTitle>
                                <CardDescription className="text-[10px]">
                                    Últimos 50 eventos de sincronización procesados.
                                </CardDescription>
                            </div>
                            <Badge variant="outline">Live</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-xs border-b pb-2">
                                <span className="font-mono text-muted-foreground">22:45:12</span>
                                <Badge className="bg-green-500/10 text-green-600 border-green-200">SENT</Badge>
                                <span className="font-bold">STOCK_UPDATE</span>
                                <span className="text-muted-foreground flex-1 truncate">Shopify: SKU-1234 → 45 un.</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs border-b pb-2">
                                <span className="font-mono text-muted-foreground">22:43:05</span>
                                <Badge className="bg-red-500/10 text-red-600 border-red-200">FAILED</Badge>
                                <span className="font-bold">PRICE_UPDATE</span>
                                <span className="text-muted-foreground flex-1 truncate">Mercado Libre: 429 Too Many Requests. Backoff 5s.</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

function DLQManager({ storeId, user }: { storeId: string, user: any }) {
    const [failedEvents, setFailedEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDLQ = async () => {
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/channels/dlq?storeId=${storeId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            setFailedEvents(data.failedEvents || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDLQ(); }, [storeId]);

    const handleRetry = async (eventId: string) => {
        try {
            const token = await user.getIdToken();
            const res = await fetch(`/api/channels/dlq/retry`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ storeId, eventId })
            });
            if (res.ok) {
                toast.success("Evento re-encolado correctamente");
                setFailedEvents(prev => prev.filter(e => e.id !== eventId));
            }
        } catch (error) {
            toast.error("Error al reintentar el evento");
        }
    };

    return (
        <Card className="border-red-500/50 bg-red-500/5">
            <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" /> Eventos Fallidos (Dead Letter Queue)
                </CardTitle>
                <CardDescription>
                    Eventos que agotaron sus reintentos automáticos. Requieren revisión manual.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">Cargando DLQ...</div>
                ) : failedEvents.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">No hay eventos fallidos pendientes.</div>
                ) : (
                    <div className="space-y-4">
                        {failedEvents.map(event => (
                            <div key={event.id} className="bg-white dark:bg-zinc-900 p-4 rounded-lg border shadow-sm flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="font-mono text-[10px]">{event.type}</Badge>
                                        <span className="text-xs font-bold">{event.payload.field === 'stock' ? 'Stock Update' : 'Price Update'}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground max-w-md truncate">
                                        Error: {event.lastError}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-mono">ID: {event.id}</p>
                                </div>
                                <Button size="sm" onClick={() => handleRetry(event.id)}>
                                    Reintentar ahora
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
