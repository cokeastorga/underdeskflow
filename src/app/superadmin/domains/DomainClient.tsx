"use client";

import { useState, useEffect } from "react";
import { Globe, ShieldCheck, RefreshCcw, Search, PlusCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { verifyDomainDns, DomainStatus } from "./actions";

interface DomainClientProps {
    initialDomains: DomainStatus[];
}

export default function DomainClient({ initialDomains }: DomainClientProps) {
    const [domains, setDomains] = useState<DomainStatus[]>(initialDomains);
    const [checking, setChecking] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, { valid: boolean, records: string[], error?: string }>>({});

    const handleVerify = async (domain: string) => {
        setChecking(domain);
        try {
            const res = await verifyDomainDns(domain);
            setResults(prev => ({ ...prev, [domain]: { valid: res.isValid, records: res.records, error: res.error } }));
        } catch (e) {
            console.error(e);
        } finally {
            setChecking(null);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white font-heading">Gestión de Dominios</h1>
                    <p className="text-zinc-400 mt-2">
                        Verificación en tiempo real de DNS (A/CNAME) y estado SSL para tenants.
                    </p>
                </div>
                <Button className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nuevo Root Domain
                </Button>
            </div>

            <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input placeholder="Buscar dominio o tienda..." className="pl-10 h-10 border-none bg-zinc-950 text-zinc-300 shadow-inner" />
                </div>
                <Button variant="outline" className="h-10 border-zinc-800 text-zinc-400 bg-zinc-950">Filtros</Button>
            </div>

            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-lg text-zinc-200">Dominios Instalados</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800 text-zinc-500 text-[10px] font-bold uppercase tracking-widest text-left bg-zinc-800/20">
                                    <th className="py-4 font-medium px-6">Dominio</th>
                                    <th className="py-4 font-medium px-4">Tienda</th>
                                    <th className="py-4 font-medium px-4">Tipo</th>
                                    <th className="py-4 font-medium px-4">DNS Status</th>
                                    <th className="py-4 font-medium px-6 text-right">Verificar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60 transition-all">
                                {domains.map((d) => {
                                    const res = results[d.domain];
                                    const isChecking = checking === d.domain;

                                    return (
                                        <tr key={d.domain} className="hover:bg-zinc-800/30 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded bg-blue-500/10 flex items-center justify-center">
                                                        <Globe className="h-4 w-4 text-blue-400" />
                                                    </div>
                                                    <span className="font-semibold text-zinc-200">{d.domain}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-zinc-400 text-xs">
                                                {d.storeName}
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge variant="outline" className="text-[10px] font-bold uppercase py-0.5 px-1.5 border-none bg-zinc-800 text-zinc-400 tracking-tighter capitalize italic">
                                                    {d.type}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4">
                                                {res ? (
                                                    <div className="flex items-center gap-2">
                                                        {res.valid ? (
                                                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                                                        ) : (
                                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                                        )}
                                                        <div className="flex flex-col">
                                                            <span className={`text-[11px] font-bold ${res.valid ? "text-emerald-400" : "text-red-400"}`}>
                                                                {res.valid ? "DNS OK" : "Config Errónea"}
                                                            </span>
                                                            <span className="text-[9px] text-zinc-600 font-mono italic">
                                                                {res.records[0] || res.error}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-zinc-600 italic">Pendiente verificación</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => handleVerify(d.domain)}
                                                    disabled={isChecking}
                                                    className="h-8 group-hover:bg-zinc-800 text-zinc-500 group-hover:text-zinc-200 transition-all border border-transparent group-hover:border-zinc-700"
                                                >
                                                    <RefreshCcw className={`h-3.5 w-3.5 mr-2 ${isChecking ? "animate-spin" : ""}`} />
                                                    {isChecking ? "Chequeando..." : "Validar"}
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {domains.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-24 text-center text-zinc-600 text-sm">
                                            No se han registrado dominios personalizados todavía.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
