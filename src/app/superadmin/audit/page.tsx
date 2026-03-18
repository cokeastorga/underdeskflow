import { adminDb } from "@/lib/firebase/admin-config";
import { Badge } from "@/components/ui/badge";
import { 
    Table, TableBody, TableCell, 
    TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    Shield, Search, Filter, 
    Calendar, User, Building, Info 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

async function getGlobalAuditLogs() {
    const snap = await adminDb.collection("audit_logs")
        .orderBy("timestamp", "desc")
        .limit(100)
        .get();
    
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export default async function GlobalAuditPage() {
    const logs = await getGlobalAuditLogs();

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <Shield className="h-8 w-8 text-violet-500" />
                        Registro de Auditoría Global
                    </h1>
                    <p className="text-zinc-400 mt-2">
                        Historial completo de acciones administrativas y eventos críticos del sistema.
                    </p>
                </div>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Eventos Recientes</CardTitle>
                            <CardDescription>Mostrando los últimos 100 eventos procesados.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                <Input 
                                    placeholder="Buscar por ID o acción..." 
                                    className="pl-10 bg-zinc-950 border-zinc-800 h-9 text-xs"
                                />
                            </div>
                            <Button variant="outline" size="sm" className="border-zinc-800 bg-zinc-950 text-xs">
                                <Filter className="mr-2 h-3.5 w-3.5" />
                                Filtros
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-zinc-800 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-zinc-800/30">
                                <TableRow className="hover:bg-transparent border-zinc-800">
                                    <TableHead className="text-zinc-400 text-xs py-3">Fecha y Hora</TableHead>
                                    <TableHead className="text-zinc-400 text-xs py-3">Acción</TableHead>
                                    <TableHead className="text-zinc-400 text-xs py-3">Tenant / Usuario</TableHead>
                                    <TableHead className="text-zinc-400 text-xs py-3">Entidad</TableHead>
                                    <TableHead className="text-zinc-400 text-xs py-3">Detalles</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log: any) => (
                                    <TableRow key={log.id} className="border-zinc-800 hover:bg-zinc-800/20">
                                        <TableCell className="py-4 text-xs font-mono text-zinc-500">
                                            {new Date(log.timestamp).toLocaleString("es-CL", { 
                                                day: '2-digit', month: 'short', 
                                                hour: '2-digit', minute: '2-digit', second: '2-digit' 
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-violet-500/5 text-violet-400 border-none text-[10px] font-bold py-0.5">
                                                {log.action}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                                                    <Building className="h-3 w-3 text-zinc-500" />
                                                    {log.storeId?.substring(0, 8)}...
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                                                    <User className="h-2.5 w-2.5" />
                                                    {log.userId?.substring(0, 8) || log.actorId?.substring(0, 8)}...
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{log.entityType || "SISTEMA"}</span>
                                                <span className="text-[10px] font-mono text-zinc-400">{log.entityId?.substring(0, 12)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[300px]">
                                            <div className="flex items-start gap-2 group">
                                                <Info className="h-3.5 w-3.5 text-zinc-600 mt-0.5" />
                                                <div className="text-[11px] text-zinc-400 line-clamp-2">
                                                    {log.details ? JSON.stringify(log.details) : log.metadata ? JSON.stringify(log.metadata) : "Sin detalles adicionales"}
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {logs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-32 text-center text-zinc-500">
                                            No se encontraron registros de auditoría.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

