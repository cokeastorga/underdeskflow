"use client";

import { useState } from "react";
import { 
    Search, Filter, ExternalLink, CheckCircle2, 
    AlertCircle, MoreVertical, Building 
} from "lucide-react";
import { 
    Table, TableBody, TableCell, 
    TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface StoreTableProps {
    stores: any[];
}

export function StoreTable({ stores }: StoreTableProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [planFilter, setPlanFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

    const handleImpersonate = async (storeId: string) => {
        setImpersonatingId(storeId);
        try {
            const res = await fetch("/api/superadmin/impersonate", {
                method: "POST",
                body: JSON.stringify({ storeId }),
                headers: { "Content-Type": "application/json" }
            });
            
            if (res.ok) {
                toast.success("Sesión suplantada. Redirigiendo al panel del tenant...");
                // Refresh the whole page to ensure AuthContext picks up the cookie
                window.location.href = "/tenant";
            } else {
                toast.error("Error al iniciar suplantación");
            }
        } catch (e) {
            toast.error("Error técnico al suplantar");
        } finally {
            setImpersonatingId(null);
        }
    };

    const handleFeatures = (storeId: string) => {
        router.push(`/superadmin/stores/${storeId}/features`);
    };

    const filteredStores = stores.filter(store => {
        const matchesSearch = 
            store.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            store.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            store.customDomain?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesPlan = planFilter === "all" || store.plan?.toLowerCase() === planFilter.toLowerCase();
        const matchesStatus = statusFilter === "all" || 
            (statusFilter === "active" ? store.isActive !== false : store.isActive === false);

        return matchesSearch && matchesPlan && matchesStatus;
    });

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);

    return (
        <div className="space-y-4">
            {/* ... keeping filters bar ... */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input 
                        placeholder="Buscar por nombre, ID o dominio..." 
                        className="pl-10 bg-zinc-900 border-zinc-800 focus:ring-violet-500/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {/* ... filters ... */}
                <div className="flex gap-2">
                    <select 
                        className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        value={planFilter}
                        onChange={(e) => setPlanFilter(e.target.value)}
                    >
                        <option value="all">Todos los planes</option>
                        <option value="basic">Basic</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                    </select>
                    <select 
                        className="bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Todos los estados</option>
                        <option value="active">Activos</option>
                        <option value="inactive">Inactivos</option>
                    </select>
                </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-zinc-800/50">
                        <TableRow className="hover:bg-transparent border-zinc-800">
                            <TableHead className="text-zinc-400 font-medium">Tienda</TableHead>
                            <TableHead className="text-zinc-400 font-medium">Estado</TableHead>
                            <TableHead className="text-zinc-400 font-medium">Plan</TableHead>
                            <TableHead className="text-zinc-400 font-medium">Dominio</TableHead>
                            <TableHead className="text-zinc-400 font-medium text-center">MP</TableHead>
                            <TableHead className="text-right text-zinc-400 font-medium whitespace-nowrap">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStores.map((store) => (
                            <TableRow key={store.id} className="border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                                <TableCell className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                                            <Building className="h-4 w-4 text-violet-400" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-white text-sm">{store.name || "Sin nombre"}</div>
                                            <div className="text-[10px] text-zinc-500 font-mono tracking-tighter">{store.id}</div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge 
                                        variant="outline" 
                                        className={store.isActive !== false 
                                            ? "bg-emerald-500/10 text-emerald-400 border-none text-[10px]" 
                                            : "bg-zinc-800 text-zinc-500 border-none text-[10px]"}
                                    >
                                        {store.isActive !== false ? "Activo" : "Inactivo"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px] font-mono uppercase tracking-tight">
                                        {store.plan || "basic"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {store.customDomain ? (
                                        <a 
                                            href={`https://${store.customDomain}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-violet-400 hover:text-violet-300 flex items-center gap-1 text-xs truncate max-w-[150px]"
                                        >
                                            {store.customDomain}
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    ) : (
                                        <span className="text-zinc-600 text-[10px]">Sin dominio</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-center">
                                        {store.mpConnected ? (
                                            <div title="Mercado Pago Conectado">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            </div>
                                        ) : (
                                            <div title="Sin conexión Mercado Pago">
                                                <AlertCircle className="h-4 w-4 text-amber-500 opacity-50" />
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-zinc-800 text-zinc-300 shadow-xl">
                                            <DropdownMenuLabel className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Gestión de Tenant</DropdownMenuLabel>
                                            <DropdownMenuSeparator className="bg-zinc-800" />
                                            <DropdownMenuItem className="focus:bg-zinc-800 cursor-pointer text-sm font-medium">
                                                Editar Detalles
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => handleFeatures(store.id)}
                                                className="focus:bg-zinc-800 cursor-pointer text-sm font-medium"
                                            >
                                                Configurar Features
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="focus:bg-zinc-800 cursor-pointer text-sm font-medium">
                                                Ver Facturación
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-zinc-800" />
                                            <DropdownMenuItem 
                                                onClick={() => handleImpersonate(store.id)}
                                                disabled={impersonatingId === store.id}
                                                className="focus:bg-violet-600 focus:text-white cursor-pointer text-sm font-bold text-violet-400"
                                            >
                                                {impersonatingId === store.id ? "Conectando..." : "Suplantar Sesión"}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-zinc-800" />
                                            <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer text-sm font-medium">
                                                Suspender Tienda
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredStores.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="py-20 text-center text-zinc-500 text-sm">
                                    No se encontraron tiendas que coincidan con los filtros.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
