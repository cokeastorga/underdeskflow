import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle2, AlertCircle, Server, Database, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function HQHealthPage() {
    // Mock health data - in a real app, this would fetch from a monitoring service or internal API
    const services = [
        { name: "Auth Service", status: "operational", uptime: "99.99%", latency: "42ms", icon: Server },
        { name: "Firestore Database", status: "operational", uptime: "100%", latency: "12ms", icon: Database },
        { name: "Mercado Pago Gateway", status: "operational", uptime: "99.95%", latency: "156ms", icon: Globe },
        { name: "Vercel Edge Network", status: "operational", uptime: "99.99%", latency: "5ms", icon: Activity },
    ];

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Salud del Ecosistema</h1>
                    <p className="text-muted-foreground mt-2">
                        Monitoreo en tiempo real de los servicios críticos de UnderDeskFlow.
                    </p>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20 px-4 py-1">
                    <CheckCircle2 className="w-3 h-3 mr-2" />
                    Sistemas Online
                </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {services.map((service) => (
                    <Card key={service.name} className="overflow-hidden border-border transition-all hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/30">
                            <CardTitle className="text-sm font-medium">{service.name}</CardTitle>
                            <service.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-4">
                                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20">
                                    {service.status}
                                </Badge>
                                <span className="text-xs font-mono text-muted-foreground">{service.latency}</span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Uptime 30d</span>
                                    <span className="font-medium">{service.uptime}</span>
                                </div>
                                <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full w-[99.9%]" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                        Registro de Incidentes Recientes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-none shrink-0">Info</Badge>
                            <div>
                                <p className="text-sm font-medium">Mantenimiento Programado Firebase Search</p>
                                <p className="text-xs text-muted-foreground mt-1">El despliegue de nuevos índices se ha completado exitosamente en todas las regiones.</p>
                                <span className="text-[10px] text-muted-foreground mt-2 block">Hace 2 horas</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50 opacity-60">
                            <Badge variant="outline" className="bg-zinc-500/10 text-zinc-600 border-none shrink-0">Resolved</Badge>
                            <div>
                                <p className="text-sm font-medium">Latencia Elevada en API de Transbank</p>
                                <p className="text-xs text-muted-foreground mt-1">Se detectó una degradación temporal en el servicio de autorización. Resuelto por el proveedor.</p>
                                <span className="text-[10px] text-muted-foreground mt-2 block">Ayer, 14:20</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
